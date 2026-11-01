import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

const certPath = path.resolve('server/ssl/server.crt');
const keyPath = path.resolve('server/ssl/server.key');
const hasSSL = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rolldownOptions: {input: {
      campus: path.resolve('client/index.html'),
      pavilion: path.resolve('client/pavilion.html'),
    }},
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: hasSSL ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : false,
    proxy: {
      '/api': {target:'http://localhost:3001',xfwd:true},
      '/admin': {target:'http://localhost:3001',xfwd:true},
      '/ws': { target: 'ws://localhost:3001', ws: true }
    }
  }
});
