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
    const { brand, model, year } = req.query;

    console.log('[Campaigns] GET / - Fetching campaigns');
    
    if (!db) {
      console.error('[Campaigns] Database connection not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const collection = db.collection<Campaign>(COLLECTIONS.CAMPAIGNS);
    
    // Build query based on filters
    const query: any = { isActive: true };
    if (brand) query.vehicleBrand = brand;
    if (model) query.vehicleModel = model;
    if (year) query.vehicleYear = parseInt(year as string);

    const campaigns = await collection.find(query).toArray();
    
    // Transform dates and calculate remaining time
    const transformedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      remainingDays: Math.ceil(
        (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      formattedStartDate: new Date(campaign.startDate).toLocaleDateString('tr-TR'),
      formattedEndDate: new Date(campaign.endDate).toLocaleDateString('tr-TR'),
      savingsAmount: campaign.originalPrice - campaign.discountedPrice
    }));

    res.json({ campaigns: transformedCampaigns });
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

    // Transform campaign data
    const transformedCampaign = {
      ...campaign,
      remainingDays: Math.ceil(
        (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      formattedStartDate: new Date(campaign.startDate).toLocaleDateString('tr-TR'),
      formattedEndDate: new Date(campaign.endDate).toLocaleDateString('tr-TR'),
      savingsAmount: campaign.originalPrice - campaign.discountedPrice
    };
    
    res.json(transformedCampaign);
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
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      isActive: true
    };

    const newCampaign: Campaign = {
      ...campaignData,
      createdAt: new Date(),
      updatedAt: new Date()
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
    
    if (req.body.startDate) {
      updateData.startDate = new Date(req.body.startDate);
    }
    
    if (req.body.endDate) {
      updateData.endDate = new Date(req.body.endDate);
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