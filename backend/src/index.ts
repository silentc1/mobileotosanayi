import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import app from './app';

dotenv.config();

// Debug middleware to log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`[Server] Server is running on http://${HOST}:${PORT}`);
});
