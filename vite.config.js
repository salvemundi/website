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
            // Add Authorization header for all requests through the proxy
            // Use the same API key as in directus.ts
            const apiKey = 'Dp8exZFEp1l9Whq2o2-5FYeiGoKFwZ2m';
            proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
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
            // Add Authorization header for all requests through the proxy
            // Use the same API key as in directus.ts
            const apiKey = 'Dp8exZFEp1l9Whq2o2-5FYeiGoKFwZ2m';
            proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
          });
        }
      },
    },
  },
});

