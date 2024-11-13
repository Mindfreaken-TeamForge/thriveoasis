import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { auth } from '../firebase';

const router = express.Router();

// Configure CORS
router.use(cors({
  origin: true,
  credentials: true
}));

// Auth middleware
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Proxy middleware options
const options = {
  target: 'https://firebasestorage.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': ''
  },
  onProxyRes: (proxyRes: any, req: express.Request, res: express.Response) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    
    // Handle audio streaming
    if (proxyRes.headers['content-type']?.includes('audio')) {
      proxyRes.headers['Accept-Ranges'] = 'bytes';
      
      // Support range requests
      const range = req.headers.range;
      if (range) {
        const positions = range.replace(/bytes=/, '').split('-');
        const start = parseInt(positions[0], 10);
        const total = parseInt(proxyRes.headers['content-length'], 10);
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        
        proxyRes.headers['Content-Range'] = `bytes ${start}-${end}/${total}`;
        proxyRes.headers['Content-Length'] = end - start + 1;
        res.status(206);
      }
    }
  },
  onError: (err: Error, req: express.Request, res: express.Response) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
};

// Create proxy middleware
const proxyMiddleware = createProxyMiddleware(options);

// Proxy route
router.get('/proxy', authMiddleware, proxyMiddleware);

export default router;