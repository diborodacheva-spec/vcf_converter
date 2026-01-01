
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Плагин для поддержки React
  // define позволяет использовать process.env в браузере
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  }
});
