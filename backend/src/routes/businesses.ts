import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';
import { Business } from '../types/business';

const router = Router();

// Helper function to convert MongoDB document to Business type
function convertToBusiness(doc: any): Business {
  return {
    ...doc,
    _id: doc._id.toString(),
  };
}

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const db: Db = req.app.locals.db;
    const businesses = await db.collection(COLLECTIONS.BUSINESSES)
      .find()
      .sort({ rating: -1 })
      .toArray();

    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error getting businesses:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Get businesses by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const db: Db = req.app.locals.db;
    
    const businesses = await db.collection(COLLECTIONS.BUSINESSES)
      .find({ category })
      .sort({ rating: -1 })
      .toArray();

    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error getting businesses by category:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Get a single business by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db: Db = req.app.locals.db;
    
    const business = await db.collection(COLLECTIONS.BUSINESSES)
      .findOne({ _id: new ObjectId(id) });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(convertToBusiness(business));
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({ error: 'Failed to get business' });
  }
});

export default router; 