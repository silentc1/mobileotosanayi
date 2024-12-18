import { Business } from '../services/mongodb';

const API_URL = 'http://localhost:3000/api';

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  public async getAllBusinesses(): Promise<Business[]> {
    return this.fetchWithAuth('/businesses');
  }

  public async getBusinessById(id: string): Promise<Business> {
    return this.fetchWithAuth(`/businesses/${id}`);
  }

  public async getBusinessesByCategory(category: string): Promise<Business[]> {
    return this.fetchWithAuth(`/businesses/category/${encodeURIComponent(category)}`);
  }

  public async searchBusinesses(query: string): Promise<Business[]> {
    return this.fetchWithAuth(`/businesses/search?q=${encodeURIComponent(query)}`);
  }

  public setToken(token: string) {
    this.token = token;
  }

  public clearToken() {
    this.token = null;
  }
}

export const apiService = ApiService.getInstance(); 