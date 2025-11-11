import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { qrcode } from 'vite-plugin-qrcode';

export default defineConfig({
  plugins: [tailwindcss(), qrcode()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Separate proxy for assets (no auth header)
      '/api/assets': {
        target: 'https://admin.salvemundi.nl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove authorization header for asset requests
            proxyReq.removeHeader('Authorization');
          });
        }
      },
      // Regular API proxy (with auth header)
      '/api': {
        target: 'https://admin.salvemundi.nl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Separate proxy for assets (no auth header)
      '/api/assets': {
        target: 'https://admin.salvemundi.nl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove authorization header for asset requests
            proxyReq.removeHeader('Authorization');
          });
        }
      },
      // Regular API proxy (with auth header)
      '/api': {
        target: 'https://admin.salvemundi.nl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
});

