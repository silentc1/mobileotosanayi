import { Router } from 'express';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';

const router = Router();

// Get all acil services with filters
router.get('/', async (req, res) => {
  try {
    const { sehir, ilce, kategori } = req.query;
    const db: Db = req.app.locals.db;

    console.log('GET /acil - Fetching acil services');
    console.log('Database connection:', !!db);
    console.log('Collection name:', COLLECTIONS.ACIL);

    // Build filter object
    const filter: any = {};
    if (sehir) filter.acilSehir = sehir;
    if (ilce) filter.acilIlce = ilce;
    if (kategori) filter.acilType = kategori;

    console.log('Applying filter:', filter);

    const acilServices = await db.collection(COLLECTIONS.ACIL)
      .find(filter)
      .toArray();

    console.log(`Found ${acilServices.length} services`);
    console.log('First service:', acilServices[0] || 'No services found');

    // Get unique values for filters
    const uniqueSehirler = await db.collection(COLLECTIONS.ACIL)
      .distinct('acilSehir');
    const uniqueIlceler = await db.collection(COLLECTIONS.ACIL)
      .distinct('acilIlce');
    const uniqueKategoriler = await db.collection(COLLECTIONS.ACIL)
      .distinct('acilType');

    console.log('Unique values:', {
      sehirler: uniqueSehirler,
      ilceler: uniqueIlceler,
      kategoriler: uniqueKategoriler
    });

    const response = {
      services: acilServices,
      filters: {
        sehirler: uniqueSehirler,
        ilceler: uniqueIlceler,
        kategoriler: uniqueKategoriler
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting acil services:', error);
    res.status(500).json({ error: 'Failed to get acil services' });
  }
});

// Add new acil service
router.post('/', async (req, res) => {
  try {
    const { acilType, acilSehir, acilIlce, acilNo } = req.body;

    if (!acilType || !acilSehir || !acilIlce || !acilNo) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db: Db = req.app.locals.db;
    const result = await db.collection(COLLECTIONS.ACIL).insertOne({
      acilType,
      acilSehir,
      acilIlce,
      acilNo,
      isOpen: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ _id: result.insertedId });
  } catch (error) {
    console.error('Error creating acil service:', error);
    res.status(500).json({ error: 'Failed to create acil service' });
  }
});

// Update acil service status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ error: 'isOpen status is required' });
    }

    const db: Db = req.app.locals.db;
    await db.collection(COLLECTIONS.ACIL).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isOpen,
          updatedAt: new Date()
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating acil service status:', error);
    res.status(500).json({ error: 'Failed to update acil service status' });
  }
});

// Make sure COLLECTIONS includes ACIL
export const COLLECTIONS_UPDATE = {
  ...COLLECTIONS,
  ACIL: 'acil'
};

export default router; 