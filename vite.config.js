import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiDevPlugin } from './api/devMiddleware.js';

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
