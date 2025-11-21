import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { qrcode } from 'vite-plugin-qrcode';

export default defineConfig({
  plugins: [tailwindcss(), qrcode()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // API proxy with auth support for both data and assets
      '/api': {
        target: 'https://admin.salvemundi.nl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Do not overwrite Authorization header
          });
        }
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // API proxy with auth support for both data and assets
      '/api': {
        target: 'https://admin.salvemundi.nl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Do not overwrite Authorization header
          });
        }
      },
    },
  },
});

