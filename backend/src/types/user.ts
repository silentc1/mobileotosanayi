export interface User {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'customer' | 'business';
  favorites: string[];
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
} 