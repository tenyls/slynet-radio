import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// base: './' — сайт работает и на GitHub Pages (tenyls.github.io/slynet-radio/),
// и на своём домене, и внутри мобильного приложения (Capacitor).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
