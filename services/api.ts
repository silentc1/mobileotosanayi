import { Business, Review } from '../services/mongodb';
import { authService } from './auth';
import Constants from 'expo-constants';

// Get the server URL from environment variables or use a fallback
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3001/api';

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
    console.log('Fetching URL:', url); // Debug log

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        url,
        errorText,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
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
}

export const apiService = ApiService.getInstance(); 