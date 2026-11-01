import { defineConfig } from 'vite';
import path from 'node:path';

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
    proxy: {
      '/api': 'http://localhost:3001',
      '/admin': 'http://localhost:3001',
      '/ws': { target: 'ws://localhost:3001', ws: true }
    }
  }
});
