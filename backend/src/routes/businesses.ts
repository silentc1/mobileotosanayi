import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';
import { Business } from '../types/business';
import { BusinessRepository } from '../repositories/business.repository';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Helper function to convert MongoDB document to Business type
function convertToBusiness(doc: any): Business {
  return {
    _id: doc._id.toString(),
    name: doc.name || '',
    category: Array.isArray(doc.category) ? doc.category : [],
    rating: doc.rating || 0,
    reviewCount: doc.reviewCount || 0,
    address: doc.address || '',
    phone: doc.phone || '',
    description: doc.description || '',
    images: doc.images || [],
    latitude: doc.latitude || 0,
    longitude: doc.longitude || 0,
    placeId: doc.placeId || '',
    googleReviews: doc.googleReviews || [],
    lastGoogleSync: doc.lastGoogleSync || new Date(),
    website: doc.website || '',
    brands: doc.brands || [],
    city: doc.city || '',
    ilce: doc.ilce || '',
    appreviews: doc.appreviews || [],
    yolYardim: doc.yolYardim || {
      yardim: false,
      gece: false,
      yaklasik: "0",
      onayli: false
    }
  };
}

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const db: Db = req.app.locals.db;
    const businesses = await BusinessRepository.findAll(db);
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
    const businesses = await BusinessRepository.findByCategory(db, category);
    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error getting businesses by category:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Get businesses by brand
router.get('/brand/:brand', async (req, res) => {
  try {
    const { brand } = req.params;
    const db: Db = req.app.locals.db;
    const businesses = await BusinessRepository.findByBrand(db, brand);
    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error getting businesses by brand:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Get businesses by location
router.get('/location/:city/:ilce?', async (req, res) => {
  try {
    const { city, ilce } = req.params;
    const db: Db = req.app.locals.db;
    const businesses = await BusinessRepository.findByLocation(db, city, ilce);
    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error getting businesses by location:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Get businesses with yol yardim
router.get('/yol-yardim', async (req, res) => {
  try {
    const { gece } = req.query;
    const db: Db = req.app.locals.db;
    const businesses = await BusinessRepository.findWithYolYardim(db, gece === 'true');
    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error getting businesses with yol yardim:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Get single business
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const db: Db = req.app.locals.db;
    const business = await BusinessRepository.findById(db, id);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(convertToBusiness(business));
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({ error: 'Failed to get business' });
  }
});

// Create business
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db: Db = req.app.locals.db;
    const business = await BusinessRepository.create(db, req.body);
    res.status(201).json(convertToBusiness(business));
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Update business
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const db: Db = req.app.locals.db;
    const business = await BusinessRepository.update(db, id, req.body);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(convertToBusiness(business));
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// Delete business
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }

    const db: Db = req.app.locals.db;
    const success = await BusinessRepository.delete(db, id);
    
    if (!success) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

// Search businesses
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const db: Db = req.app.locals.db;
    const businesses = await BusinessRepository.search(db, query);
    res.json(businesses.map(convertToBusiness));
  } catch (error) {
    console.error('Error searching businesses:', error);
    res.status(500).json({ error: 'Failed to search businesses' });
  }
});

export default router; 