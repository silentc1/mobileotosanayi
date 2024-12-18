import { Business, Review } from '../services/mongodb';
import { authService } from './auth';

const API_URL = 'http://localhost:3000/api';

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
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

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