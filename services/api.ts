import { Business, Review } from '../services/mongodb';
import { authService } from './auth';
import Constants from 'expo-constants';

// Get the server URL from environment variables or use a fallback
const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                process.env.EXPO_PUBLIC_API_URL || 
                'http://localhost:3000/api';

console.log('Using API URL:', API_URL); // Debug log

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await authService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        (error as any).response = {
          status: response.status,
          data: data
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        throw error;
      }
      throw new Error('Something went wrong');
    }
  }

  // Business endpoints
  public async getAllBusinesses(): Promise<Business[]> {
    return this.fetchWithAuth('/businesses');
  }

  public async getBusinessById(id: string): Promise<Business> {
    return this.fetchWithAuth(`/businesses/${id}`);
  }

  public async getBusinessesByCategory(category: string): Promise<Business[]> {
    return this.fetchWithAuth(`/businesses/category/${encodeURIComponent(category)}`);
  }

  // Review endpoints
  public async getBusinessReviews(businessId: string): Promise<Review[]> {
    return this.fetchWithAuth(`/reviews/business/${businessId}`);
  }

  public async getUserReviews(): Promise<Review[]> {
    return this.fetchWithAuth(`/reviews/user`);
  }

  public async createReview(review: {
    businessId: string;
    rating: number;
    text: string;
    authorName: string;
  }): Promise<Review> {
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
  }): Promise<Review> {
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

  public async likeReview(reviewId: string): Promise<Review> {
    return this.fetchWithAuth(`/reviews/${reviewId}/like`, {
      method: 'POST',
    });
  }
}

export const apiService = ApiService.getInstance(); 