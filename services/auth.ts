import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './mongodb';
import Constants from 'expo-constants';

// Get the server URL from environment variables or use a fallback
const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                process.env.EXPO_PUBLIC_API_URL || 
                'http://localhost:3001/api';

console.log('Auth service using API URL:', API_URL); // Debug log

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
      console.log('Initializing auth from storage...'); // Debug log
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      console.log('Storage data:', { // Debug log
        hasToken: !!token,
        hasUserData: !!userData,
        tokenPreview: token ? '***' + token.slice(-6) : 'NO TOKEN'
      });

      if (token) {
        this.token = token;
      }

      if (userData) {
        this.user = JSON.parse(userData);
      }

      console.log('Auth initialization complete:', { // Debug log
        hasToken: !!this.token,
        hasUser: !!this.user
      });
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
      console.log('Registering new user:', { email: data.email }); // Debug log
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
      console.log('Registration successful:', { // Debug log
        hasToken: !!result.token,
        user: result.user
      });
      await this.saveAuthData(result.token, result.user);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  public async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log('Logging in user:', { email: data.email }); // Debug log
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
      console.log('Login successful:', { // Debug log
        hasToken: !!result.token,
        user: result.user
      });
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
      console.log('Logging out user...'); // Debug log
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      this.token = null;
      this.user = null;
      console.log('Logout complete'); // Debug log
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  private async saveAuthData(token: string, user: User): Promise<void> {
    try {
      console.log('Saving auth data...'); // Debug log
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user)),
      ]);
      this.token = token;
      this.user = user;
      console.log('Auth data saved successfully:', { // Debug log
        hasToken: !!this.token,
        hasUser: !!this.user,
        tokenPreview: token ? '***' + token.slice(-6) : 'NO TOKEN'
      });
    } catch (error) {
      console.error('Save auth data error:', error);
      throw error;
    }
  }

  public async getToken(): Promise<string | null> {
    try {
      console.log('Getting auth token...'); // Debug log
      if (this.token) {
        console.log('Using cached token:', '***' + this.token.slice(-6)); // Debug log
        return this.token;
      }
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      console.log('Token from storage:', token ? '***' + token.slice(-6) : 'NO TOKEN'); // Debug log
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

  public async getCurrentUser(): Promise<User | null> {
    try {
      // First check if we have a cached user
      if (this.user) {
        console.log('Using cached user:', { email: this.user.email }); // Debug log
        return this.user;
      }

      const token = await this.getToken();
      if (!token) {
        console.log('No token available for getCurrentUser'); // Debug log
        return null;
      }

      console.log('Fetching current user from API...'); // Debug log
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token invalid, clearing auth data...'); // Debug log
          await this.logout();
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const { user } = await response.json();
      console.log('Current user fetched successfully:', { email: user.email }); // Debug log
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

  public async updateUser(data: { fullName: string; email: string; phone?: string }): Promise<User | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log('No token available for updateUser'); // Debug log
        return null;
      }

      console.log('Updating user data...'); // Debug log
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const { user } = await response.json();
      console.log('User data updated successfully:', { email: user.email }); // Debug log
      this.user = user;
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Update user error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      throw error;
    }
  }
}

export const authService = AuthService.getInstance(); 