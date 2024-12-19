import { MongoClient, Db } from 'mongodb';

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sametcanturkk:2eoNohqBCzaBrRZU@test.bdfx7.mongodb.net/?retryWrites=true&w=majority&appName=test';
export const DB_NAME = process.env.DB_NAME || 'test';

export const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  REVIEWS: 'reviews',
  ACIL: 'acil',
  CAMPAIGNS: 'kampanyalar'
};

let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    console.log('Using existing database connection');
    return db;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('Database name:', DB_NAME);
    console.log('MongoDB URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db(DB_NAME);
    
    // Verify collections exist
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Verify kampanyalar collection exists
    const kampanyalarExists = collections.some(c => c.name === COLLECTIONS.CAMPAIGNS);
    console.log('Kampanyalar collection exists:', kampanyalarExists);
    
    if (!kampanyalarExists) {
      console.log('Creating kampanyalar collection...');
      await db.createCollection(COLLECTIONS.CAMPAIGNS);
      console.log('Kampanyalar collection created successfully');
    }
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
} 