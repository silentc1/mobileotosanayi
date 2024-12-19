import { Db, ObjectId, WithId, Document, Filter } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';
import bcrypt from 'bcryptjs';
import { User } from '../types/user';

type MongoUser = Omit<User, '_id'> & { _id: ObjectId };
type UserUpdateData = Omit<Partial<User>, '_id'>;

export class UserRepository {
  private static SALT_ROUNDS = 10;

  static async findById(db: Db, id: string): Promise<User | null> {
    try {
      const objectId = new ObjectId(id);
      const user = await db.collection<MongoUser>(COLLECTIONS.USERS).findOne({ 
        _id: objectId 
      });
      return user ? { ...user, _id: user._id.toString() } as User : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async findByEmail(db: Db, email: string): Promise<User | null> {
    try {
      const user = await db.collection<MongoUser>(COLLECTIONS.USERS).findOne({ email });
      return user ? { ...user, _id: user._id.toString() } as User : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async create(db: Db, userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      const newUserData = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection<MongoUser>(COLLECTIONS.USERS).insertOne(newUserData as MongoUser);

      const newUser = await this.findById(db, result.insertedId.toString());
      if (!newUser) throw new Error('Failed to create user');
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(db: Db, userId: string, data: UserUpdateData): Promise<User | null> {
    try {
      const objectId = new ObjectId(userId);
      const updateData: UserUpdateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await db.collection<MongoUser>(COLLECTIONS.USERS).findOneAndUpdate(
        { _id: objectId } as Filter<MongoUser>,
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) return null;
      return { ...result, _id: result._id.toString() } as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async updateLastLogin(db: Db, userId: string): Promise<void> {
    try {
      const objectId = new ObjectId(userId);
      await db.collection<MongoUser>(COLLECTIONS.USERS).updateOne(
        { _id: objectId } as Filter<MongoUser>,
        { $set: { lastLogin: new Date() } }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  static async updatePassword(db: Db, userId: string, newPassword: string): Promise<void> {
    try {
      const objectId = new ObjectId(userId);
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
      await db.collection<MongoUser>(COLLECTIONS.USERS).updateOne(
        { _id: objectId } as Filter<MongoUser>,
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
} 