import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { qrcode } from 'vite-plugin-qrcode';

export default defineConfig({
  plugins: [tailwindcss(), qrcode()],
  server: {
    host: '0.0.0.0',
  },
});
