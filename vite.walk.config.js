import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: 'walkthrough',
  server: { host: '0.0.0.0', port: 5174, strictPort: true,
    proxy: {'/admin':'http://localhost:3001','/api':'http://localhost:3001','/ws':{target:'ws://localhost:3001',ws:true}},
  },
  build: {
    outDir: '../dist-walk', emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL('./walkthrough/index.html', import.meta.url)),
        teacher: fileURLToPath(new URL('./walkthrough/teacher.html', import.meta.url)),
      },
    },
  },
});
