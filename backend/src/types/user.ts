export interface User {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  favorites: string[];
  role: 'customer' | 'business_owner' | 'admin';
  isEmailVerified: boolean;
  lastLogin?: Date;
} 