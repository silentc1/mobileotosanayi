import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import { MONGODB_URI, DB_NAME, COLLECTIONS } from './config/mongodb';
import authRoutes from './routes/auth';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let client: MongoClient;

async function connectToMongoDB() {
  try {
    client = await MongoClient.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    app.locals.db = client.db(DB_NAME);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/auth', authRoutes);

// Protected business routes
app.get('/api/businesses', async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const businesses = await db.collection(COLLECTIONS.BUSINESSES).find({}).toArray();
    res.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/businesses/:id', authenticateToken, async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const business = await db.collection(COLLECTIONS.BUSINESSES).findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/businesses/category/:category', async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const businesses = await db.collection(COLLECTIONS.BUSINESSES)
      .find({ category: req.params.category })
      .toArray();
    res.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/businesses/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const db = client.db(DB_NAME);
    const businesses = await db.collection(COLLECTIONS.BUSINESSES)
      .find({
        $or: [
          { name: { $regex: q as string, $options: 'i' } },
          { category: { $regex: q as string, $options: 'i' } },
          { address: { $regex: q as string, $options: 'i' } },
        ],
      })
      .toArray();
    
    res.json(businesses);
  } catch (error) {
    console.error('Error searching businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected user routes
app.get('/api/users/favorites', authenticateToken, async (req: any, res) => {
  try {
    const db = client.db(DB_NAME);
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(req.user.userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const favorites = await db.collection(COLLECTIONS.BUSINESSES)
      .find({ _id: { $in: user.favorites.map((id: string) => new ObjectId(id)) } })
      .toArray();

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  await connectToMongoDB();
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer().catch(console.error); 