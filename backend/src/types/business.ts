import { Review } from './review';

export interface Business {
  _id: string;
  ownerId: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website?: string;
  description: string;
  images: string[];
  businessHours: Array<{
    day: string;
    hours: string;
    isOpen: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    price: string;
    description?: string;
  }>;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  averageRating: number;
  reviews?: Review[];
} 