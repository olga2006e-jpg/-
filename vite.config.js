import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

let backendPort = 3001;
try {
  if (fs.existsSync('.active-port')) {
    const saved = Number(fs.readFileSync('.active-port', 'utf8').trim());
    if (saved && Number.isFinite(saved)) backendPort = saved;
  }
} catch (e) {}
if (process.env.BACKEND_PORT) {
  backendPort = Number(process.env.BACKEND_PORT) || backendPort;
}

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': `http://localhost:${backendPort}`,
      '/ws': { target: `ws://localhost:${backendPort}`, ws: true }
    }
  }
});
