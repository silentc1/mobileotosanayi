import { Db, ObjectId, WithId, Document } from 'mongodb';
import { Review } from '../types/review';
import { COLLECTIONS } from '../config/mongodb';

export class ReviewRepository {
  private static convertToReview(doc: WithId<Document>): Review {
    return {
      ...doc,
      _id: doc._id.toString(),
    } as Review;
  }

  static async findByBusinessId(db: Db, businessId: string): Promise<Review[]> {
    try {
      const reviews = await db.collection(COLLECTIONS.REVIEWS)
        .find({ businessId })
        .sort({ createdAt: -1 })
        .toArray();
      return reviews.map(this.convertToReview);
    } catch (error) {
      console.error('Error finding reviews by business ID:', error);
      throw error;
    }
  }

  static async create(db: Db, review: Omit<Review, '_id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    try {
      const newReview = {
        ...review,
        likes: 0,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection(COLLECTIONS.REVIEWS).insertOne(newReview);
      const createdReview = await db.collection(COLLECTIONS.REVIEWS)
        .findOne({ _id: result.insertedId });

      if (!createdReview) {
        throw new Error('Failed to create review');
      }

      // Update business rating and review count
      await db.collection(COLLECTIONS.BUSINESSES).updateOne(
        { _id: new ObjectId(review.businessId) },
        {
          $inc: { reviewCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );

      // Calculate and update average rating
      const reviews = await this.findByBusinessId(db, review.businessId);
      const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

      await db.collection(COLLECTIONS.BUSINESSES).updateOne(
        { _id: new ObjectId(review.businessId) },
        {
          $set: {
            rating: averageRating,
            updatedAt: new Date()
          }
        }
      );

      return this.convertToReview(createdReview);
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  static async update(db: Db, reviewId: string, update: Partial<Review>): Promise<Review | null> {
    try {
      const result = await db.collection(COLLECTIONS.REVIEWS).findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
        {
          $set: {
            ...update,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return null;
      }

      const updatedReview = this.convertToReview(result.value);

      if (update.rating) {
        const reviews = await this.findByBusinessId(db, updatedReview.businessId);
        const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await db.collection(COLLECTIONS.BUSINESSES).updateOne(
          { _id: new ObjectId(updatedReview.businessId) },
          {
            $set: {
              rating: averageRating,
              updatedAt: new Date()
            }
          }
        );
      }

      return updatedReview;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  static async delete(db: Db, reviewId: string): Promise<boolean> {
    try {
      const review = await db.collection(COLLECTIONS.REVIEWS)
        .findOne({ _id: new ObjectId(reviewId) });

      if (!review) {
        return false;
      }

      const reviewDoc = this.convertToReview(review);
      const result = await db.collection(COLLECTIONS.REVIEWS)
        .deleteOne({ _id: new ObjectId(reviewId) });

      if (result.deletedCount > 0) {
        // Update business review count
        await db.collection(COLLECTIONS.BUSINESSES).updateOne(
          { _id: new ObjectId(reviewDoc.businessId) },
          {
            $inc: { reviewCount: -1 },
            $set: { updatedAt: new Date() }
          }
        );

        // Recalculate average rating
        const reviews = await this.findByBusinessId(db, reviewDoc.businessId);
        const averageRating = reviews.length > 0
          ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
          : 0;

        await db.collection(COLLECTIONS.BUSINESSES).updateOne(
          { _id: new ObjectId(reviewDoc.businessId) },
          {
            $set: {
              rating: averageRating,
              updatedAt: new Date()
            }
          }
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  static async findById(db: Db, reviewId: string): Promise<Review | null> {
    try {
      const review = await db.collection(COLLECTIONS.REVIEWS)
        .findOne({ _id: new ObjectId(reviewId) });

      if (!review) {
        return null;
      }

      return this.convertToReview(review);
    } catch (error) {
      console.error('Error finding review by ID:', error);
      throw error;
    }
  }

  static async findMostRecentByUserId(db: Db, userId: string, afterDate: Date): Promise<Review | null> {
    try {
      const review = await db.collection(COLLECTIONS.REVIEWS)
        .findOne(
          {
            userId,
            createdAt: { $gte: afterDate }
          },
          {
            sort: { createdAt: -1 }
          }
        );

      if (!review) {
        return null;
      }

      return this.convertToReview(review);
    } catch (error) {
      console.error('Error finding most recent review by user ID:', error);
      throw error;
    }
  }
} 