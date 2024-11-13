import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add CORS headers
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range');
            proxyReq.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            proxyReq.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            
            // Forward authorization header
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Handle audio streaming
            if (proxyRes.headers['content-type']?.includes('audio')) {
              proxyRes.headers['accept-ranges'] = 'bytes';
              
              const range = req.headers.range;
              if (range) {
                const positions = range.replace(/bytes=/, '').split('-');
                const start = parseInt(positions[0], 10);
                const total = parseInt(proxyRes.headers['content-length'], 10);
                const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                
                res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
                res.setHeader('Content-Length', end - start + 1);
                res.statusCode = 206;
              }
            }
          });
        },
      },
    },
  },
})