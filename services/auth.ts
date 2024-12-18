import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './mongodb';
import Constants from 'expo-constants';

// Get the server URL from environment variables or use a fallback
const API_URL = 'http://192.168.1.5:3000/api'; // Use the same IP as api.ts

// Export storage keys for use in other files
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

export type RegisterData = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // Initialize token and user from storage
    this.initializeFromStorage();
  }

  private async initializeFromStorage() {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token) {
        this.token = token;
      }

      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const result = await response.json();
      await this.saveAuthData(result.token, result.user);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const result = await response.json();
      await this.saveAuthData(result.token, result.user);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Login request timed out. Please check your internet connection and try again.');
        }
        console.error('Login error:', error);
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  public async logout(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      this.token = null;
      this.user = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    try {
      // First check if we have a cached user
      if (this.user) {
        return this.user;
      }

      const token = await this.getToken();
      if (!token) return null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          await this.logout();
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const { user } = await response.json();
      this.user = user;
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out');
      }
      return null;
    }
  }

  private async saveAuthData(token: string, user: User): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user)),
      ]);
      this.token = token;
      this.user = user;
    } catch (error) {
      console.error('Save auth data error:', error);
      throw error;
    }
  }

  public async getToken(): Promise<string | null> {
    try {
      if (this.token) return this.token;
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      this.token = token;
      return token;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = AuthService.getInstance(); 