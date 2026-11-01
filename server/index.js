import https from 'node:https';
import { getOrCreateSSLCert } from './ssl/certHelper.js';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { AuthManager } from './auth.js';
import { setupMultiplayer } from './multiplayer.js';
import { TOTAL_WORLD_CHUNKS, TOTAL_WORLD_CANONICAL_BYTES } from './world.js';
import { AgentService } from './ai/agentService.js';
import { db } from './db.js';
import { createAdminRouter } from './adminRoutes.js';
import { isHostAdmin, requireHostAdmin } from './adminAccess.js';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const PORT_HTTPS = process.env.HTTPS_PORT || 3443;

const app = express();
app.use(express.json());
const publicUser=user=>({username:user.username,color:user.color,x:user.x,y:user.y,z:user.z,rotY:user.rotY});
app.get('/api/access',(req,res)=>{res.set('Cache-Control','no-store');res.json({isAdmin:isHostAdmin(req)});});
app.get('/api/me',(req,res)=>{
  const token=(req.headers.authorization||'').replace(/^Bearer /,'');const username=AuthManager.verifyToken(token);
  if(!username)return res.status(401).json({success:false,error:'Сессия завершена. Выполните вход.'});
  res.set('Cache-Control','no-store');res.json({success:true,user:publicUser(db.getUser(username))});
});
app.post('/api/logout',(req,res)=>{AuthManager.logout((req.headers.authorization||'').replace(/^Bearer /,''));res.json({success:true});});

// Enable CORS for local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// REST Endpoints
app.post('/api/register', (req, res) => {
  const { username, password, color } = req.body || {};
  const auth = AuthManager.register(username, password, color);
  if (auth.error) {
    return res.status(400).json({ success: false, error: auth.error });
  }
  res.json({
    success: true,
    token: auth.token,
    user: publicUser(auth.user),
    authType: 'registered',
    isGuest: false,
    message: auth.message,
    world: {
      totalChunks: TOTAL_WORLD_CHUNKS,
      totalWorldBytes: TOTAL_WORLD_CANONICAL_BYTES,
      maxClientCachePercent: 10
    }
  });
});

app.post('/api/login', (req, res) => {
  const { username, color, password } = req.body || {};
  if(req.body?.mode==='login'&&!db.getUser(typeof username==='string'?username.trim().slice(0,20):'')?.passwordHash)return res.status(401).json({success:false,error:'Аккаунт не зарегистрирован. Выберите регистрацию или гостевой вход.'});
  const auth = AuthManager.login(username, color, password);
  if (auth.error) {
    return res.status(401).json({ success: false, error: auth.error });
  }
  res.json({
    success: true,
    token: auth.token,
    user: publicUser(auth.user),
    authType: auth.authType || 'guest_session',
    isGuest: !!auth.isGuest,
    disclaimer: auth.disclaimer || 'Авторизованный вход',
    world: {
      totalChunks: TOTAL_WORLD_CHUNKS,
      totalWorldBytes: TOTAL_WORLD_CANONICAL_BYTES,
      maxClientCachePercent: 10
    }
  });
});

app.get('/api/status', async (req, res) => {
  const ollamaHealth = await AgentService.checkOllamaHealth();
  res.json({
    status: 'online',
    timestamp: Date.now(),
    totalChunks: TOTAL_WORLD_CHUNKS,
    totalWorldBytes: TOTAL_WORLD_CANONICAL_BYTES,
    databaseEngine: db.type,
    aiModel: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b',
    ollama: ollamaHealth
  });
});

// Serve Admin Dashboard (доступ открыт для локальной сети и демонстрации)
app.use('/admin', requireHostAdmin);
app.get('/admin', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'admin/index.html'));
});
app.use('/admin', express.static(path.resolve(__dirname, 'admin')));

// Serve frontend: if dist exists serve dist, otherwise serve client root
const distPath = path.resolve(__dirname, '../dist');
const clientPath = path.resolve(__dirname, '../client');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(clientPath));
}

// HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const multiplayer = setupMultiplayer(wss);
app.use('/api/admin', createAdminRouter(multiplayer));

// Detect LAN IP
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n======================================================');
  console.log('🎃 HAUNTED ACADEMY — HACKATHON SERVER READY!');
  console.log(`📡 Localhost HTTP:     http://localhost:${PORT}`);
  console.log(`⚙️  Admin Dashboard:    http://localhost:${PORT}/admin`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`🌐 LAN HTTP:          http://${ip}:${PORT}`);
      console.log(`⚙️  LAN Admin (Mac):   http://${ip}:${PORT}/admin`);
    });
  } else {
    console.log('🌐 LAN: (No active Wi-Fi / LAN interface detected, offline mode)');
  }
  console.log('🤖 AI Endpoint:       Ollama on localhost:11434 (with smart offline fallback)');
  console.log('======================================================\n');
});

// Запуск HTTPS и WSS (Dual Server: HTTP 3001 + HTTPS 3443)
try {
  const sslCerts = await getOrCreateSSLCert();
  const httpsServer = https.createServer(sslCerts, app);
  httpsServer.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });
  httpsServer.listen(PORT_HTTPS, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log(`🔒 HTTPS Server:       https://localhost:${PORT_HTTPS}`);
    console.log(`🔒 HTTPS Admin:        https://localhost:${PORT_HTTPS}/admin`);
    ips.forEach(ip => {
      console.log(`🔒 LAN HTTPS (Mac):    https://${ip}:${PORT_HTTPS}`);
      console.log(`🔒 LAN Admin (Mac):    https://${ip}:${PORT_HTTPS}/admin`);
    });
    console.log('======================================================\n');
  });
} catch (e) {
  console.warn('[HTTPS] Не удалось запустить HTTPS сервер:', e.message);
}
