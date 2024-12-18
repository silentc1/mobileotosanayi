import { Db, ObjectId } from 'mongodb';
import { Review } from '../services/mongodb';
import { COLLECTIONS } from '../config/mongodb';

export class ReviewRepository {
  static async findByBusinessId(db: Db, businessId: string): Promise<Review[]> {
    try {
      const reviews = await db.collection(COLLECTIONS.REVIEWS)
        .find({ businessId })
        .sort({ createdAt: -1 })
        .toArray();
      return reviews as Review[];
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

      return createdReview as Review;
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

      if (result.value && update.rating) {
        const review = result.value as Review;
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
      }

      return result.value as Review | null;
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

      const result = await db.collection(COLLECTIONS.REVIEWS)
        .deleteOne({ _id: new ObjectId(reviewId) });

      if (result.deletedCount > 0) {
        // Update business review count
        await db.collection(COLLECTIONS.BUSINESSES).updateOne(
          { _id: new ObjectId(review.businessId) },
          {
            $inc: { reviewCount: -1 },
            $set: { updatedAt: new Date() }
          }
        );

        // Recalculate average rating
        const reviews = await this.findByBusinessId(db, review.businessId);
        const averageRating = reviews.length > 0
          ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
          : 0;

        await db.collection(COLLECTIONS.BUSINESSES).updateOne(
          { _id: new ObjectId(review.businessId) },
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
      return review as Review | null;
    } catch (error) {
      console.error('Error finding review by ID:', error);
      throw error;
    }
  }
} 