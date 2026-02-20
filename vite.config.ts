import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  define: {
    'process.env': JSON.stringify({
      ...process.env,
      API_KEY: process.env.API_KEY || "AIzaSyBDfY2zsi5QVlV3bB5VpzPWZdabPELHujI",
    })
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['copy.agenciafoxon.com.br'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
  },
});