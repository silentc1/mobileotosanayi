import { Client, PlaceData, Language } from '@googlemaps/google-maps-services-js';
import { config } from '../config';
import { Review } from '../types/business';

export class GooglePlacesService {
  private static instance: GooglePlacesService;
  private client: Client;

  private constructor() {
    this.client = new Client({});
  }

  public static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      GooglePlacesService.instance = new GooglePlacesService();
    }
    return GooglePlacesService.instance;
  }

  public async getPlaceDetails(placeId: string): Promise<{
    name: string;
    rating: number;
    reviewCount: number;
    reviews: Review[];
    address: string;
    phone?: string;
    website?: string;
  }> {
    try {
      // Validate API key
      if (!config.googlePlacesApiKey) {
        throw new Error('Google Places API key is not configured');
      }

      console.log('=== Google Places API Request ===');
      console.log(`PlaceId: ${placeId}`);
      console.log(`API Key: ${config.googlePlacesApiKey ? '***' + config.googlePlacesApiKey.slice(-4) : 'NOT SET'}`);
      
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: config.googlePlacesApiKey,
          language: Language.tr,
          fields: ['name', 'rating', 'user_ratings_total', 'reviews', 'formatted_address', 'formatted_phone_number', 'website'],
        },
      });

      console.log('=== Google Places API Response ===');
      console.log('Status:', response.data.status);
      console.log('Has Result:', !!response.data.result);
      if (response.data.error_message) {
        console.error('API Error Message:', response.data.error_message);
      }
      
      const place = response.data.result;
      
      if (!place) {
        throw new Error(`No place details found for placeId: ${placeId}. Status: ${response.data.status}`);
      }

      const reviews: Review[] = (place.reviews || []).map(review => ({
        rating: review.rating,
        text: review.text,
        time: typeof review.time === 'string' ? Date.parse(review.time) : review.time,
        authorName: review.author_name,
        userId: `google_${review.author_name.toLowerCase().replace(/\s+/g, '_')}`, // Create a consistent userId for Google reviews
      }));

      console.log('=== Processed Data ===');
      console.log('Name:', place.name);
      console.log('Rating:', place.rating);
      console.log('Review Count:', place.user_ratings_total);
      console.log('Reviews Found:', reviews.length);

      return {
        name: place.name || '',
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        reviews,
        address: place.formatted_address || '',
        phone: place.formatted_phone_number,
        website: place.website,
      };
    } catch (error) {
      console.error('=== Google Places API Error ===');
      console.error('Error Type:', error instanceof Error ? error.name : typeof error);
      console.error('Error Message:', error instanceof Error ? error.message : String(error));
      console.error('Stack Trace:', error instanceof Error ? error.stack : 'No stack trace available');
      throw error;
    }
  }
} 