import { Router, Request, Response } from 'express';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from '../config/mongodb';
import { Campaign, CreateCampaignDto, UpdateCampaignDto } from '../types/campaign';

const router = Router();

// Debug middleware for this route
router.use((req: Request, res: Response, next) => {
  console.log(`[Campaigns] ${req.method} ${req.path}`);
  console.log('[Campaigns] Request body:', req.body);
  console.log('[Campaigns] Request query:', req.query);
  next();
});

// Get all campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const db: Db = req.app.locals.db;

    console.log('[Campaigns] GET / - Fetching campaigns');
    console.log('[Campaigns] Database connection:', !!db);
    console.log('[Campaigns] Collection name:', COLLECTIONS.CAMPAIGNS);

    if (!db) {
      console.error('[Campaigns] Database connection not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const collection = db.collection<Campaign>(COLLECTIONS.CAMPAIGNS);
    console.log('[Campaigns] Collection object:', !!collection);

    const campaigns = await collection.find({}).toArray();
    console.log(`[Campaigns] Found ${campaigns.length} campaigns`);
    console.log('[Campaigns] First campaign:', campaigns[0] || 'No campaigns found');

    res.json({ campaigns });
  } catch (error) {
    console.error('[Campaigns] Database error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaign by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db: Db = req.app.locals.db;
    console.log(`[Campaigns] GET /${req.params.id} - Fetching campaign by ID`);
    
    const campaign = await db.collection<Campaign>(COLLECTIONS.CAMPAIGNS)
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!campaign) {
      console.log(`[Campaigns] Campaign not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('[Campaigns] Found campaign:', campaign);
    res.json(campaign);
  } catch (error) {
    console.error('[Campaigns] Database error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create new campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const db: Db = req.app.locals.db;
    console.log('[Campaigns] POST / - Creating new campaign');
    
    const campaignData: CreateCampaignDto = {
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      brands: req.body.brands,
      discount: req.body.discount,
      validUntil: new Date(req.body.validUntil),
      business: req.body.business,
    };

    const newCampaign: Campaign = {
      ...campaignData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    const result = await db.collection<Campaign>(COLLECTIONS.CAMPAIGNS).insertOne(newCampaign);
    console.log('[Campaigns] Created campaign with ID:', result.insertedId);
    res.status(201).json({ ...newCampaign, _id: result.insertedId });
  } catch (error) {
    console.error('[Campaigns] Database error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db: Db = req.app.locals.db;
    console.log(`[Campaigns] PUT /${req.params.id} - Updating campaign`);
    
    const updateData: UpdateCampaignDto = {
      ...req.body,
      updatedAt: new Date()
    };
    
    if (req.body.validUntil) {
      updateData.validUntil = new Date(req.body.validUntil);
    }
    
    const result = await db.collection<Campaign>(COLLECTIONS.CAMPAIGNS)
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    
    if (!result) {
      console.log(`[Campaigns] Campaign not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('[Campaigns] Updated campaign:', result);
    res.json(result);
  } catch (error) {
    console.error('[Campaigns] Database error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db: Db = req.app.locals.db;
    console.log(`[Campaigns] DELETE /${req.params.id} - Deleting campaign`);
    
    const result = await db.collection<Campaign>(COLLECTIONS.CAMPAIGNS)
      .deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      console.log(`[Campaigns] Campaign not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('[Campaigns] Deleted campaign successfully');
    res.status(204).send();
  } catch (error) {
    console.error('[Campaigns] Database error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router; 