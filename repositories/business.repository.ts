import { Db, ObjectId } from 'mongodb';
import { Business } from '../services/mongodb';
import { COLLECTIONS } from '../config/mongodb';

export class BusinessRepository {
  static async findAll(db: Db): Promise<Business[]> {
    try {
      const businesses = await db.collection(COLLECTIONS.BUSINESSES).find({}).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error finding businesses:', error);
      throw error;
    }
  }

  static async findById(db: Db, id: string): Promise<Business | null> {
    try {
      const business = await db.collection(COLLECTIONS.BUSINESSES).findOne({ _id: new ObjectId(id) });
      return business as Business | null;
    } catch (error) {
      console.error('Error finding business by id:', error);
      throw error;
    }
  }

  static async findByCategory(db: Db, category: string): Promise<Business[]> {
    try {
      const businesses = await db.collection(COLLECTIONS.BUSINESSES).find({ category }).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error finding businesses by category:', error);
      throw error;
    }
  }

  static async create(db: Db, business: Omit<Business, '_id'>): Promise<Business> {
    try {
      const result = await db.collection(COLLECTIONS.BUSINESSES).insertOne({
        ...business,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const newBusiness = await this.findById(db, result.insertedId.toString());
      if (!newBusiness) throw new Error('Failed to create business');
      return newBusiness;
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  }

  static async update(db: Db, id: string, business: Partial<Business>): Promise<Business | null> {
    try {
      const result = await db.collection(COLLECTIONS.BUSINESSES).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...business,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      
      return result.value as Business | null;
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  }

  static async delete(db: Db, id: string): Promise<boolean> {
    try {
      const result = await db.collection(COLLECTIONS.BUSINESSES).deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }

  static async search(db: Db, query: string): Promise<Business[]> {
    try {
      const businesses = await db.collection(COLLECTIONS.BUSINESSES).find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } },
        ],
      }).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error searching businesses:', error);
      throw error;
    }
  }
} 