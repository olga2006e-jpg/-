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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

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
    user: auth.user,
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
  const auth = AuthManager.login(username, color, password);
  if (auth.error) {
    return res.status(401).json({ success: false, error: auth.error });
  }
  res.json({
    success: true,
    token: auth.token,
    user: auth.user,
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

// Serve frontend: if dist exists serve dist, otherwise serve client root
const distPath = path.resolve(__dirname, '../dist');
const clientPath = path.resolve(__dirname, '../client');
import fs from 'node:fs';
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(clientPath));
}

// HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
setupMultiplayer(wss);

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

function startServer(initialPort, maxAttempts = 20) {
  let attempts = 0;

  function tryListen(port) {
    server.removeAllListeners('error');
    server.removeAllListeners('listening');

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        attempts++;
        if (attempts < maxAttempts) {
          const nextPort = port + 1;
          console.warn(`⚠️  Порт ${port} занят другим процессом. Переключаемся на порт ${nextPort}...`);
          tryListen(nextPort);
        } else {
          console.error(`❌ Не удалось запустить сервер: диапазон портов с ${initialPort} по ${port} занят.`);
          process.exit(1);
        }
      } else {
        console.error('❌ Ошибка запуска сервера:', err);
        process.exit(1);
      }
    });

    server.once('listening', () => {
      const activePort = server.address().port;
      try {
        fs.writeFileSync(path.resolve(__dirname, '../.active-port'), String(activePort), 'utf8');
      } catch (e) {}

      const ips = getLocalIPs();
      console.log('\n======================================================');
      console.log('🎃 HAUNTED ACADEMY — HACKATHON SERVER READY!');
      console.log(`📡 Localhost:     http://localhost:${activePort}`);
      if (ips.length > 0) {
        ips.forEach(ip => {
          console.log(`🌐 LAN (Wi-Fi):   http://${ip}:${activePort}`);
        });
      } else {
        console.log('🌐 LAN: (No active Wi-Fi / LAN interface detected, offline mode)');
      }
      console.log('🤖 AI Endpoint:   Ollama on localhost:11434 (with smart offline fallback)');
      console.log('======================================================\n');
    });

    server.listen(port, '0.0.0.0');
  }

  tryListen(initialPort);
}

startServer(Number(PORT) || 3001);
