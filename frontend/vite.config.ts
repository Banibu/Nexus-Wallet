import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env variables from the root directory
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  return {
    plugins: [react()],
    envDir: '..', // Look for .env in the parent (root) directory
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(env.REACT_APP_BACKEND_URL || ''),
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true, // Listen on all network interfaces
      allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
