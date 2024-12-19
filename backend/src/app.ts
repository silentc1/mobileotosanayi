import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './config/mongodb';
import acilRoutes from './routes/acil';
import authRoutes from './routes/auth';
import businessRoutes from './routes/businesses';
import reviewRoutes from './routes/reviews';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToDatabase()
  .then((db) => {
    app.locals.db = db;
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/acil', acilRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default app; 