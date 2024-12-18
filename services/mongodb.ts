import { MongoClient, Db } from 'mongodb';
import { MONGODB_URI, DB_NAME } from '../backend/src/config/mongodb';

export type User = {
  _id: string;
  email: string;
  password: string; // This will be hashed
  fullName: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  favorites: string[]; // Array of business IDs
  role: 'customer' | 'business_owner' | 'admin';
  isEmailVerified: boolean;
  lastLogin?: Date;
};

export type Review = {
  _id: string;
  businessId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userAvatar?: string;
  likes: number;
  isVerified: boolean;
};

export type Business = {
  _id: string;
  ownerId: string; // Reference to User._id
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website?: string;
  description: string;
  images: string[];
  businessHours: Array<{
    day: string;
    hours: string;
    isOpen: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    price: string;
    description?: string;
  }>;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  averageRating: number;
  reviews?: Review[];
};

class MongoDBService {
  private static instance: MongoDBService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('MongoDB is already connected');
      return;
    }

    try {
      this.client = await MongoClient.connect(MONGODB_URI);
      this.db = this.client.db(DB_NAME);
      this.isConnected = true;
      console.log('MongoDB connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
      console.log('MongoDB disconnected successfully');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  public getDb(): Db | null {
    return this.db;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const mongoDBService = MongoDBService.getInstance(); 