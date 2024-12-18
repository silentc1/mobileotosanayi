import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { MONGODB_URI, DB_NAME } from './config/mongodb';
import authRoutes from './routes/auth';
import reviewRoutes from './routes/reviews';
import businessRoutes from './routes/businesses';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
let db: any;
MongoClient.connect(MONGODB_URI)
  .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
    app.locals.db = db;
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/businesses', businessRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 