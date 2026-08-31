import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api to the local NestJS backend so the SPA and API
// share an origin, matching the production Nginx layout (docs/deployment-vm.md).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/content': 'http://localhost:3000',
    },
  },
});
