import { Db, ObjectId, WithId, Document, OptionalId, UpdateFilter } from 'mongodb';
import * as bcrypt from 'bcryptjs';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'business' | 'admin';
  favorites: string[];
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserRepository {
  private static readonly COLLECTION = 'users';
  private static readonly SALT_ROUNDS = 10;

  static async create(db: Db, userData: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<WithId<User>> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      const newUser: OptionalId<User> = {
        ...userData,
        password: hashedPassword,
        favorites: userData.favorites || [],
        isEmailVerified: userData.isEmailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      };

      const result = await db.collection<User>(this.COLLECTION).insertOne(newUser);
      
      const createdUser = await this.findById(db, result.insertedId.toString());
      if (!createdUser) {
        throw new Error('Failed to create user');
      }
      
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async findByEmail(db: Db, email: string): Promise<WithId<User> | null> {
    try {
      return await db.collection<User>(this.COLLECTION).findOne({ email });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  static async findById(db: Db, id: string): Promise<WithId<User> | null> {
    try {
      return await db.collection<User>(this.COLLECTION).findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw new Error('Failed to verify password');
    }
  }

  static async updateLastLogin(db: Db, userId: ObjectId): Promise<void> {
    try {
      await db.collection<User>(this.COLLECTION).updateOne(
        { _id: userId },
        { $set: { lastLogin: new Date(), updatedAt: new Date() } }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login');
    }
  }

  static async updateFavorites(db: Db, userId: ObjectId, favorites: string[]): Promise<WithId<User> | null> {
    try {
      const result = await db.collection<User>(this.COLLECTION).findOneAndUpdate(
        { _id: userId },
        { $set: { favorites, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      
      return result;
    } catch (error) {
      console.error('Error updating favorites:', error);
      throw new Error('Failed to update favorites');
    }
  }

  static async addToFavorites(db: Db, userId: ObjectId, businessId: string): Promise<WithId<User> | null> {
    try {
      const result = await db.collection<User>(this.COLLECTION).findOneAndUpdate(
        { _id: userId },
        { 
          $addToSet: { favorites: businessId },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );
      
      return result;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  }

  static async removeFromFavorites(db: Db, userId: ObjectId, businessId: string): Promise<WithId<User> | null> {
    try {
      const result = await db.collection<User>(this.COLLECTION).findOneAndUpdate(
        { _id: userId },
        { 
          $pull: { favorites: businessId } as UpdateFilter<User>['$pull'],
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );
      
      return result;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  }

  static async update(db: Db, userId: string, updateData: { fullName: string; email: string; phone?: string }): Promise<WithId<User> | null> {
    try {
      // Check if email is being changed and if it's already taken
      if (updateData.email) {
        const existingUser = await this.findByEmail(db, updateData.email);
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new Error('Email already in use');
        }
      }

      const result = await db.collection<User>(this.COLLECTION).findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
} 