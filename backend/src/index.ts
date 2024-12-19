import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import app from './app';

dotenv.config();

// Debug middleware to log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Server] ${req.method} ${req.originalUrl}`);
  console.log('[Server] Headers:', req.headers);
  next();
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`[Server] Server is running on http://${HOST}:${PORT}`);
  console.log('[Server] Available endpoints:');
  console.log('- GET /api/health');
  console.log('- GET /api/campaigns');
  console.log('- GET /api/campaigns/:id');
  console.log('- POST /api/campaigns');
  console.log('- PUT /api/campaigns/:id');
  console.log('- DELETE /api/campaigns/:id');
  console.log('- GET /api/businesses');
  console.log('- GET /api/businesses/:id');
  console.log('- GET /api/acil');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/register');
});