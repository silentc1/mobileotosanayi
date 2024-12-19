import { MongoClient, Db } from 'mongodb';

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sametcanturkk:2eoNohqBCzaBrRZU@test.bdfx7.mongodb.net/?retryWrites=true&w=majority&appName=test';
export const DB_NAME = process.env.DB_NAME || 'test';

export const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  REVIEWS: 'reviews',
  ACIL: 'acil'
};

let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('Database name:', DB_NAME);
    
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db(DB_NAME);
    
    // Verify collections exist
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
} 