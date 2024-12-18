import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../constants';
import { Business, Review } from '../types/business';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

// Helper function to check if user has reviewed in the last week
async function hasReviewedInLastWeek(db: Db, businessId: string, authorName: string): Promise<boolean> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const business = await db.collection<Business>(COLLECTIONS.BUSINESSES).findOne({
    _id: new ObjectId(businessId),
    appreviews: {
      $elemMatch: {
        authorName: authorName,
        time: {
          $gte: oneWeekAgo.getTime()
        }
      }
    }
  });

  return !!business;
}

// Get all reviews for a business
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    if (!ObjectId.isValid(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    const db: Db = req.app.locals.db;
    const business = await db.collection(COLLECTIONS.BUSINESSES)
      .findOne({ _id: new ObjectId(businessId) });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const reviews = {
      googleReviews: business.googleReviews || [],
      appreviews: business.appreviews || []
    };

    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Add a new app review
router.post('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { rating, text, authorName } = req.body;

    if (!ObjectId.isValid(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    if (!rating || !text || !authorName) {
      return res.status(400).json({ error: 'Rating, text, and author name are required' });
    }

    const db: Db = req.app.locals.db;

    // Check if user has already reviewed this business in the last week
    const hasReviewed = await hasReviewedInLastWeek(db, businessId, authorName);
    if (hasReviewed) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'You can only review a business once per week'
      });
    }

    const review: Review = {
      rating: Number(rating),
      text,
      authorName,
      time: new Date().getTime(),
    };

    const result = await db.collection<Business>(COLLECTIONS.BUSINESSES).findOneAndUpdate(
      { _id: new ObjectId(businessId) },
      { 
        $push: { 
          "appreviews": review
        } as any,
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Delete an app review
router.delete('/business/:businessId/review/:reviewTime', async (req, res) => {
  try {
    const { businessId, reviewTime } = req.params;

    if (!ObjectId.isValid(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    const db: Db = req.app.locals.db;
    const result = await db.collection<Business>(COLLECTIONS.BUSINESSES).findOneAndUpdate(
      { _id: new ObjectId(businessId) },
      { 
        $pull: { 
          "appreviews": { time: Number(reviewTime) }
        } as any,
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Business or review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get user reviews
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const db: Db = req.app.locals.db;

    // Get user's reviews with business details
    const reviews = await db.collection('reviews')
      .aggregate([
        {
          $match: {
            userId: new ObjectId(decoded.userId)
          }
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessId',
            foreignField: '_id',
            as: 'business'
          }
        },
        {
          $unwind: {
            path: '$business',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            rating: 1,
            text: 1,
            createdAt: 1,
            'business._id': 1,
            'business.name': 1
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray();

    res.json(reviews);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 