// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: false,
  },
  plugins: [react(), tailwindcss()],
});