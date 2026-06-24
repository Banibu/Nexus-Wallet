import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env variables from the repository root and also allow Vercel project env vars.
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL || env.REACT_APP_BACKEND_URL || '';

  return {
    plugins: [react()],
    envDir: '..', // Look for .env in the parent (root) directory
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(apiUrl),
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true, // Listen on all network interfaces
      allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8002',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
