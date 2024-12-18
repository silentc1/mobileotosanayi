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
  updateUser: (data: {
    fullName: string;
    email: string;
    phone?: string;
  }) => Promise<void>;
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
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log('User validated successfully:', currentUser.email);
          setUser(currentUser);
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
        } else {
          console.log('Token invalid, logging out...');
          await authService.logout();
        }
      } else {
        console.log('No token found');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: { fullName: string; email: string; phone?: string }) => {
    try {
      console.log('Updating user data...');
      const updatedUser = await authService.updateUser(data);
      if (updatedUser) {
        console.log('User data updated successfully');
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
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
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
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
        updateUser,
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