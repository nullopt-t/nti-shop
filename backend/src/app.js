import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import publicRoutes from './routes/publicRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist/frontend/browser');
const uploadsDir = path.resolve(__dirname, '../uploads');

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'nti-clothing-shop-backend',
  });
});

// Serve uploaded clothing images
app.use('/uploads', express.static(uploadsDir));

// Public storefront routes
app.use('/api', publicRoutes);

// Manager administrative routes
app.use('/api/manager', managerRoutes);

// Serve Angular static production build
app.use(express.static(frontendDist));

// Single Page Application (SPA) routing fallback for non-API requests
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
  }
  res.sendFile(path.resolve(frontendDist, 'index.html'));
});

// Central error handler
app.use(errorHandler);

export default app;
