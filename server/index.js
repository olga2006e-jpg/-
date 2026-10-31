import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { AuthManager } from './auth.js';
import { setupMultiplayer } from './multiplayer.js';
import { TOTAL_WORLD_CHUNKS } from './world.js';

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
app.post('/api/login', (req, res) => {
  const { username, color } = req.body || {};
  const auth = AuthManager.login(username, color);
  res.json({
    success: true,
    token: auth.token,
    user: auth.user,
    world: {
      totalChunks: TOTAL_WORLD_CHUNKS,
      maxClientCachePercent: 10
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    totalChunks: TOTAL_WORLD_CHUNKS,
    aiModel: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b'
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

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n======================================================');
  console.log('🎃 HAUNTED ACADEMY — HACKATHON SERVER READY!');
  console.log(`📡 Localhost:     http://localhost:${PORT}`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`🌐 LAN (Wi-Fi):   http://${ip}:${PORT}`);
    });
  } else {
    console.log('🌐 LAN: (No active Wi-Fi / LAN interface detected, offline mode)');
  }
  console.log('🤖 AI Endpoint:   Ollama on localhost:11434 (with smart offline fallback)');
  console.log('======================================================\n');
});
