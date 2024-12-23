import { Business, Review } from '../services/mongodb';
import { authService } from './auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Campaign } from '../components/CampaignButton';

// Get the server URL from environment variables or use a fallback
const API_URL = __DEV__ 
  ? Platform.select({
      ios: 'http://192.168.1.5:3001/api',
      android: 'http://10.0.2.2:3001/api',
      default: 'http://localhost:3001/api',
    })
  : 'https://your-production-api.com/api';

console.log('Using API URL:', API_URL); // Debug log

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_URL;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log('Fetching URL:', url);
    console.log('Request options:', {
      method: options.method || 'GET',
      hasBody: !!options.body,
      headers: options.headers,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.log('Error response:', errorData);

        // Try to parse error data as JSON
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch {
          parsedError = { error: errorData };
        }

        // For rate limit errors, return a special response instead of throwing
        if (response.status === 429) {
          return {
            error: true,
            status: 429,
            message: 'Rate limit exceeded',
            details: 'You can only review a business once per week'
          };
        }

        // For other errors, throw as usual
        const error = new Error(parsedError.message || parsedError.error || 'API request failed');
        (error as any).response = {
          status: response.status,
          data: parsedError
        };
        throw error;
      }

      const data = await response.json();
      console.log('Response data:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        keys: data ? Object.keys(data) : null,
      });
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await authService.getToken();
    return this.fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Acil services
  public async getAcilServices(filters?: {
    sehir?: string;
    ilce?: string;
    kategori?: string;
  }): Promise<{
    services: any[];
    filters: {
      sehirler: string[];
      ilceler: string[];
      kategoriler: string[];
    };
  }> {
    const queryParams = new URLSearchParams();
    if (filters?.sehir) queryParams.append('sehir', filters.sehir);
    if (filters?.ilce) queryParams.append('ilce', filters.ilce);
    if (filters?.kategori) queryParams.append('kategori', filters.kategori);

    const queryString = queryParams.toString();
    return this.fetch(`/acil${queryString ? `?${queryString}` : ''}`);
  }

  public async createAcilService(data: {
    acilType: string;
    acilSehir: string;
    acilIlce: string;
    acilNo: string;
  }): Promise<{ _id: string }> {
    return this.fetchWithAuth('/acil', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateAcilServiceStatus(id: string, isOpen: boolean): Promise<void> {
    return this.fetchWithAuth(`/acil/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isOpen }),
    });
  }

  // Business endpoints
  public async getAllBusinesses(): Promise<Business[]> {
    return this.fetch('/businesses');
  }

  public async getBusinessById(id: string): Promise<Business> {
    return this.fetch(`/businesses/${id}`);
  }

  public async getBusinessesByCategory(category: string): Promise<Business[]> {
    return this.fetch(`/businesses/category/${encodeURIComponent(category)}`);
  }

  // Review endpoints
  public async getBusinessReviews(businessId: string): Promise<any> {
    return this.fetch(`/reviews/business/${businessId}`);
  }

  public async getUserReviews(): Promise<Review[]> {
    return this.fetch('/reviews/user');
  }

  public async createReview(review: {
    businessId: string;
    rating: number;
    text: string;
    authorName: string;
  }): Promise<any> {
    return this.fetchWithAuth(`/reviews/business/${review.businessId}`, {
      method: 'POST',
      body: JSON.stringify({
        rating: review.rating,
        text: review.text,
        authorName: review.authorName
      }),
    });
  }

  public async updateReview(reviewId: string, update: {
    rating?: number;
    comment?: string;
  }): Promise<any> {
    return this.fetchWithAuth(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  public async deleteReview(reviewId: string): Promise<void> {
    return this.fetchWithAuth(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  public async likeReview(reviewId: string): Promise<any> {
    return this.fetchWithAuth(`/reviews/${reviewId}/like`, {
      method: 'POST',
    });
  }

  // Password change endpoint
  public async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    return this.fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Campaign endpoints
  public async getCampaigns(): Promise<any> {
    console.log('Fetching campaigns from API...');
    try {
      const response = await this.fetch('/campaigns');
      console.log('Raw campaign response:', response);

      // Transform campaign data if needed
      if (response && response.campaigns) {
        const transformedCampaigns = response.campaigns.map((campaign: any) => ({
          ...campaign,
          startDate: new Date(campaign.startDate),
          endDate: new Date(campaign.endDate),
          createdAt: new Date(campaign.createdAt),
          updatedAt: new Date(campaign.updatedAt)
        }));
        return { campaigns: transformedCampaigns };
      }

      return response;
    } catch (error) {
      console.error('Error in getCampaigns:', error);
      throw error;
    }
  }

  public async createCampaign(data: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    images: string[];
    terms: string;
    features: string[];
    stockCount: number;
    dealerLocations: string[];
  }): Promise<any> {
    return this.fetchWithAuth('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Favorites endpoints
  public async getFavorites(): Promise<Business[]> {
    const response = await this.fetchWithAuth('/auth/favorites');
    console.log('Raw favorites response:', JSON.stringify(response, null, 2));
    if (!response || !response.favorites) {
      console.warn('Invalid favorites response:', response);
      return [];
    }
    return Array.isArray(response.favorites) ? response.favorites : [];
  }

  public async addFavorite(businessId: string): Promise<void> {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    console.log('Adding favorite for business ID:', businessId);
    const response = await this.fetchWithAuth('/auth/favorites/add', {
      method: 'POST',
      body: JSON.stringify({ businessId }),
    });
    console.log('Add favorite response:', JSON.stringify(response, null, 2));
    
    // Verify the response
    if (!response || !response.message) {
      console.warn('Unexpected add favorite response:', response);
    }
    return response;
  }

  public async removeFavorite(businessId: string): Promise<void> {
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    console.log('Removing favorite for business ID:', businessId);
    const response = await this.fetchWithAuth('/auth/favorites/remove', {
      method: 'POST',
      body: JSON.stringify({ businessId }),
    });
    console.log('Remove favorite response:', JSON.stringify(response, null, 2));
    
    // Verify the response
    if (!response || !response.message) {
      console.warn('Unexpected remove favorite response:', response);
    }
    return response;
  }

  // Campaign related API calls
  public async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const response = await this.fetch('/campaigns');
      const data = await response.json();
      return data.campaigns;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  public async getCampaignById(id: string): Promise<Campaign> {
    try {
      const response = await this.fetch(`/campaigns/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance(); 