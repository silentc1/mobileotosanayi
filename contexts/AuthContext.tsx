import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../services/mongodb';
import { authService, USER_DATA_KEY } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, onLoginSuccess?: () => void) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounted, checking user...');
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      console.log('Checking for existing token...');
      const token = await authService.getToken();
      
      if (token) {
        console.log('Token found, validating...');
        // Validate the token by getting the current user
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log('User validated successfully:', currentUser.email);
          setUser(currentUser);
          // Ensure user data is stored
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
        } else {
          console.log('Token invalid, logging out...');
          // If getCurrentUser returns null, the token is invalid
          await authService.logout();
        }
      } else {
        console.log('No token found');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // On error, clear the invalid token
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, onLoginSuccess?: () => void) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authService.login({ email, password });
      console.log('Login successful, fetching user data...');
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        console.log('User data fetched successfully');
        setUser(currentUser);
        // Store user data in AsyncStorage for persistence
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
        // Call the success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => {
    try {
      console.log('Attempting registration for:', data.email);
      const response = await authService.register(data);
      console.log('Registration successful, fetching user data...');
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        console.log('User data fetched successfully');
        setUser(currentUser);
        // Store user data in AsyncStorage for persistence
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
      }
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await authService.logout();
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem(USER_DATA_KEY);
      setUser(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}