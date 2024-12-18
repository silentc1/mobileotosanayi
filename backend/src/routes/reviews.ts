import { Router } from 'express';
import { ReviewRepository } from '../repositories/review.repository';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
  businessId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).optional(),
});

// Helper function to check if user has reviewed in the past week
async function hasReviewedInPastWeek(db: any, userId: string): Promise<boolean> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentReview = await ReviewRepository.findMostRecentByUserId(db, userId, oneWeekAgo);
  return !!recentReview;
}

// Get reviews for a business
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const db = req.app.locals.db;
    
    const reviews = await ReviewRepository.findByBusinessId(db, businessId);
    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Create a new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validation = createReviewSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Geçersiz yorum bilgileri'
      });
    }

    const db = req.app.locals.db;
    const user = req.user!; // We know user exists because of authenticateToken
    const { businessId, rating, comment } = validation.data;

    // Check if user has already reviewed in the past week
    const hasReviewed = await hasReviewedInPastWeek(db, user.id);
    if (hasReviewed) {
      return res.status(429).json({
        success: false,
        data: null,
        message: 'Her işletme için haftada bir yorum yapabilirsiniz. Lütfen bir sonraki hafta tekrar deneyiniz.'
      });
    }

    const review = await ReviewRepository.create(db, {
      businessId,
      userId: user.id,
      rating,
      comment,
      userName: 'Anonymous',
      userAvatar: undefined,
      likes: 0,
      isVerified: false,
    });

    return res.status(201).json({
      success: true,
      data: review,
      message: 'Yorum başarıyla eklendi'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Yorum eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// Update a review
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const validation = updateReviewSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const db = req.app.locals.db;
    const { reviewId } = req.params;
    const user = req.user!; // We know user exists because of authenticateToken

    // Check if the review belongs to the user
    const existingReview = await ReviewRepository.findById(db, reviewId);
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (existingReview.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    const updatedReview = await ReviewRepository.update(db, reviewId, validation.data);
    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { reviewId } = req.params;
    const user = req.user!; // We know user exists because of authenticateToken

    // Check if the review belongs to the user
    const existingReview = await ReviewRepository.findById(db, reviewId);
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (existingReview.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    const success = await ReviewRepository.delete(db, reviewId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Like a review
router.post('/:reviewId/like', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { reviewId } = req.params;

    // First check if the review exists
    const existingReview = await ReviewRepository.findById(db, reviewId);
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update the likes count
    const review = await ReviewRepository.update(db, reviewId, {
      likes: existingReview.likes + 1,
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error liking review:', error);
    res.status(500).json({ error: 'Failed to like review' });
  }
});

export default router; 