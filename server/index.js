import http from 'node:http';
import https from 'node:https';
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
import { getTlsCredentials } from './tls.js';
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

// WebSocket Server (shared across HTTP and HTTPS)
const wss = new WebSocketServer({ noServer: true });
setupMultiplayer(wss);

function attachWebSocketUpgrade(serverInstance) {
  serverInstance.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}

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

const localIPs = getLocalIPs();
const tlsEnabled = process.env.ENABLE_TLS !== 'false' && process.env.NO_TLS !== '1';
const tlsCreds = tlsEnabled ? getTlsCredentials(localIPs) : null;

// Primary HTTP server
const httpServer = http.createServer(app);
attachWebSocketUpgrade(httpServer);

// Optional HTTPS / TLS server
let httpsServer = null;
if (tlsCreds) {
  try {
    httpsServer = https.createServer({ key: tlsCreds.key, cert: tlsCreds.cert }, app);
    attachWebSocketUpgrade(httpsServer);
  } catch (err) {
    console.warn(`[TLS] Failed to create HTTPS server: ${err.message}`);
    httpsServer = null;
  }
}

function startServer(initialHttpPort, initialHttpsPort, maxAttempts = 20) {
  let httpAttempts = 0;
  let activeHttpPort = initialHttpPort;
  let activeHttpsPort = initialHttpsPort;

  function tryListenHttp(port) {
    httpServer.removeAllListeners('error');
    httpServer.removeAllListeners('listening');

    httpServer.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        httpAttempts++;
        if (httpAttempts < maxAttempts) {
          const nextPort = port + 1;
          console.warn(`⚠️  HTTP Порт ${port} занят. Переключаемся на ${nextPort}...`);
          tryListenHttp(nextPort);
        } else {
          console.error(`❌ Не удалось запустить HTTP сервер: диапазон занят.`);
          process.exit(1);
        }
      } else {
        console.error('❌ Ошибка запуска HTTP сервера:', err);
        process.exit(1);
      }
    });

    httpServer.once('listening', () => {
      activeHttpPort = httpServer.address().port;
      try {
        fs.writeFileSync(path.resolve(__dirname, '../.active-port'), String(activeHttpPort), 'utf8');
      } catch (e) {}

      if (httpsServer) {
        tryListenHttps(initialHttpsPort);
      } else {
        printBanner(activeHttpPort, null);
      }
    });

    httpServer.listen(port, '0.0.0.0');
  }

  function tryListenHttps(port) {
    httpsServer.removeAllListeners('error');
    httpsServer.removeAllListeners('listening');

    httpsServer.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.warn(`⚠️  HTTPS Порт ${port} занят. Переключаемся на ${nextPort}...`);
        tryListenHttps(nextPort);
      } else {
        console.warn(`[TLS] HTTPS server error: ${err.message}. Running HTTP only.`);
        printBanner(activeHttpPort, null);
      }
    });

    httpsServer.once('listening', () => {
      activeHttpsPort = httpsServer.address().port;
      printBanner(activeHttpPort, activeHttpsPort);
    });

    httpsServer.listen(port, '0.0.0.0');
  }

  function printBanner(httpPort, httpsPort) {
    const ips = getLocalIPs();
    console.log('\n======================================================');
    console.log('🎃 HAUNTED ACADEMY — HACKATHON SERVER READY!');
    console.log(`📡 HTTP (Localhost):     http://localhost:${httpPort}`);
    if (httpsPort) {
      console.log(`🔒 HTTPS/TLS (Local):    https://localhost:${httpsPort}`);
    }
    if (ips.length > 0) {
      ips.forEach(ip => {
        console.log(`🌐 LAN HTTP:             http://${ip}:${httpPort}`);
        if (httpsPort) {
          console.log(`🔒 LAN HTTPS (WebXR/VR): https://${ip}:${httpsPort}`);
        }
      });
    } else {
      console.log('🌐 LAN: (No active Wi-Fi / LAN interface detected, offline mode)');
    }
    console.log('🤖 AI Endpoint:   Ollama on localhost:11434 (with smart offline fallback)');
    console.log('======================================================\n');
  }

  tryListenHttp(initialHttpPort);
}

const HTTP_PORT = Number(process.env.PORT) || 3001;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;
startServer(HTTP_PORT, HTTPS_PORT);
