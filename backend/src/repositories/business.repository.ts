import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';
import { Business, CreateBusinessDto, UpdateBusinessDto } from '../types/business';

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

  static async create(db: Db, businessData: CreateBusinessDto): Promise<Business> {
    try {
      const result = await db.collection(COLLECTIONS.BUSINESSES).insertOne({
        ...businessData,
        _id: new ObjectId(),
        lastGoogleSync: new Date(),
        googleReviews: [],
        appreviews: [],
        yolYardim: businessData.yolYardim || {
          yardim: false,
          gece: false,
          yaklasik: "0",
          onayli: false
        }
      });
      
      const newBusiness = await this.findById(db, result.insertedId.toString());
      if (!newBusiness) throw new Error('Failed to create business');
      return newBusiness;
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  }

  static async update(db: Db, id: string, businessData: UpdateBusinessDto): Promise<Business | null> {
    try {
      const result = await db.collection(COLLECTIONS.BUSINESSES).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: businessData },
        { returnDocument: 'after' }
      );
      
      if (!result || !result.value) {
        return null;
      }
      
      return result.value as Business;
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
          { brands: { $regex: query, $options: 'i' } },
          { city: { $regex: query, $options: 'i' } },
          { ilce: { $regex: query, $options: 'i' } }
        ],
      }).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error searching businesses:', error);
      throw error;
    }
  }

  static async findByBrand(db: Db, brand: string): Promise<Business[]> {
    try {
      const businesses = await db.collection(COLLECTIONS.BUSINESSES).find({ brands: brand }).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error finding businesses by brand:', error);
      throw error;
    }
  }

  static async findByLocation(db: Db, city: string, ilce?: string): Promise<Business[]> {
    try {
      const query: any = { city };
      if (ilce) query.ilce = ilce;
      
      const businesses = await db.collection(COLLECTIONS.BUSINESSES).find(query).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error finding businesses by location:', error);
      throw error;
    }
  }

  static async findWithYolYardim(db: Db, gece?: boolean): Promise<Business[]> {
    try {
      const query: any = { 'yolYardim.yardim': true };
      if (typeof gece === 'boolean') query['yolYardim.gece'] = gece;
      
      const businesses = await db.collection(COLLECTIONS.BUSINESSES).find(query).toArray();
      return businesses as Business[];
    } catch (error) {
      console.error('Error finding businesses with yol yardim:', error);
      throw error;
    }
  }
} 