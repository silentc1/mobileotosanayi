import { Db, ObjectId, WithId, Document } from 'mongodb';
import { COLLECTIONS } from '../constants';
import { Business } from '../types/business';
import { GooglePlacesService } from '../services/google-places.service';

export class BusinessRepository {
  // ... existing code ...

  static async updateFromGooglePlaces(db: Db, businessId: string | ObjectId, placeId: string): Promise<Business> {
    try {
      console.log('=== Starting Business Update ===');
      console.log('Business ID:', businessId);
      console.log('Place ID:', placeId);

      const googlePlacesService = GooglePlacesService.getInstance();
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);

      console.log('=== MongoDB Update Operation ===');
      console.log('Updating document with ID:', businessId);
      console.log('Update data:', {
        name: placeDetails.name,
        rating: placeDetails.rating,
        reviewCount: placeDetails.reviewCount,
        reviewsCount: placeDetails.reviews.length,
        hasAddress: !!placeDetails.address,
        hasPhone: !!placeDetails.phone,
        hasWebsite: !!placeDetails.website,
      });

      const result = await db.collection<Business>(COLLECTIONS.BUSINESSES).findOneAndUpdate(
        { _id: typeof businessId === 'string' ? new ObjectId(businessId) : businessId },
        { 
          $set: {
            name: placeDetails.name,
            rating: placeDetails.rating,
            reviewCount: placeDetails.reviewCount,
            address: placeDetails.address,
            phone: placeDetails.phone,
            website: placeDetails.website,
            googleReviews: placeDetails.reviews,
            updatedAt: new Date(),
            lastGoogleSync: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        console.error('MongoDB Update Failed:', {
          businessId,
          collection: COLLECTIONS.BUSINESSES
        });
        throw new Error(`Failed to update business with id ${businessId}`);
      }

      console.log('=== Update Success ===');
      console.log('Updated Business:', {
        id: result._id.toString(),
        name: result.name,
        rating: result.rating,
        reviewCount: result.reviewCount,
        lastSync: result.lastGoogleSync,
      });

      return {
        ...result,
        _id: result._id.toString(),
      } as Business;
    } catch (error) {
      console.error('=== Business Update Error ===');
      console.error('Error Type:', error instanceof Error ? error.name : typeof error);
      console.error('Error Message:', error instanceof Error ? error.message : String(error));
      console.error('Stack Trace:', error instanceof Error ? error.stack : 'No stack trace available');
      throw error;
    }
  }

  static async findBusinessesWithoutGoogleData(db: Db): Promise<Business[]> {
    try {
      console.log('Searching for businesses without Google data...');
      
      // First, let's check all businesses with placeId
      const allBusinesses = await db.collection(COLLECTIONS.BUSINESSES)
        .find({ placeId: { $exists: true } })
        .toArray();
      
      console.log(`Found ${allBusinesses.length} businesses with placeId`);
      
      // Now filter for those needing sync
      const businesses = await db.collection(COLLECTIONS.BUSINESSES)
        .find({
          placeId: { $exists: true },
          $or: [
            { lastGoogleSync: { $exists: false } },
            { googleReviews: { $exists: false } }
          ]
        })
        .toArray();
      
      console.log(`Found ${businesses.length} businesses needing sync`);
      console.log('Businesses needing sync:', businesses.map(b => ({
        id: b._id.toString(),
        name: b.name,
        placeId: b.placeId,
        hasLastSync: !!b.lastGoogleSync,
        hasGoogleReviews: !!b.googleReviews
      })));
      
      return businesses.map(business => ({
        ...business,
        _id: business._id.toString(),
      })) as Business[];
    } catch (error) {
      console.error('Error finding businesses without Google data:', error);
      throw error;
    }
  }
} 