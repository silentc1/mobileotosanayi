import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';
import { Business } from '../types/business';
import { BusinessRepository } from '../repositories/business.repository';

const router = Router();

// Helper function to convert MongoDB document to Business type
function convertToBusiness(doc: any): Business {
  const converted = {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    ownerId: doc.ownerId || '',
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
    createdAt: doc.createdAt?.toString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toString() || new Date().toISOString(),
    averageRating: doc.averageRating || 0,
    placeId: doc.placeId || '',
    googleReviews: doc.googleReviews || [],
    lastGoogleSync: doc.lastGoogleSync?.toString() || '',
    website: doc.website || '',
    brands: doc.brands || [],
    city: doc.city || '',
    ilce: doc.ilce || '',
    appreviews: doc.appreviews || [],
    businessHours: doc.businessHours || [],
    services: doc.services || [],
  };

  return converted;
}

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  try {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      new ObjectId(id);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
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
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

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

// Sync business with Google Places data
router.post('/:id/sync-google-places', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    const db: Db = req.app.locals.db;
    const business = await db.collection(COLLECTIONS.BUSINESSES)
      .findOne({ _id: new ObjectId(id) });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.placeId) {
      return res.status(400).json({ error: 'Business does not have a Google Place ID' });
    }

    const updatedBusiness = await BusinessRepository.updateFromGooglePlaces(db, id, business.placeId);
    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error syncing business with Google Places:', error);
    res.status(500).json({ 
      error: 'Failed to sync business with Google Places',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Sync all businesses that need Google Places data
router.post('/sync-all-google-places', async (req, res) => {
  try {
    const db: Db = req.app.locals.db;
    const businesses = await BusinessRepository.findBusinessesWithoutGoogleData(db);
    
    console.log('Found businesses to sync:', businesses.map(b => ({ id: b._id, placeId: b.placeId })));
    
    const results = await Promise.allSettled(
      businesses.map(async business => {
        try {
          if (!business.placeId) {
            throw new Error(`Business ${business._id} has no placeId`);
          }
          if (!isValidObjectId(business._id.toString())) {
            throw new Error(`Invalid business ID format: ${business._id}`);
          }
          console.log(`Starting sync for business: ${business._id} with placeId: ${business.placeId}`);
          const result = await BusinessRepository.updateFromGooglePlaces(db, business._id, business.placeId);
          console.log(`Successfully synced business: ${business._id}`);
          return result;
        } catch (error) {
          console.error(`Failed to sync business ${business._id}:`, error);
          throw error;
        }
      })
    );

    const failedResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    const failedErrors = failedResults.map(r => r.reason);
    
    const summary = {
      total: businesses.length,
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: failedResults.length,
      errors: failedErrors.map(e => e.message || String(e))
    };

    console.log('Sync summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error syncing all businesses with Google Places:', error);
    res.status(500).json({ 
      error: 'Failed to sync businesses with Google Places',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Force sync a specific business with Google Places data
router.post('/:id/force-sync-google-places', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    const db: Db = req.app.locals.db;
    const business = await db.collection(COLLECTIONS.BUSINESSES)
      .findOne({ _id: new ObjectId(id) });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.placeId) {
      return res.status(400).json({ error: 'Business does not have a Google Place ID' });
    }

    console.log(`Force syncing business ${id} with placeId ${business.placeId}`);
    const updatedBusiness = await BusinessRepository.updateFromGooglePlaces(db, id, business.placeId);
    console.log(`Successfully force synced business ${id}`);
    
    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error force syncing business with Google Places:', error);
    res.status(500).json({ 
      error: 'Failed to force sync business with Google Places',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 