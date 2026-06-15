import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  return {
    envDir: '../',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy API + WS to backend so frontend can use relative URLs in prod
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000',
          changeOrigin: true,
        },
        '/ws': {
          target: env.VITE_WS_URL?.replace('ws://', 'http://') || 'http://localhost:4000',
          ws: true,
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
