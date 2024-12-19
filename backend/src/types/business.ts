import { ObjectId } from 'mongodb';

export interface Review {
  rating: number;
  text: string;
  time: number;
  authorName: string;
  userId: string;
}

export interface Business {
  _id: string | ObjectId;
  ownerId: string;
  name: string;
  category: string[];
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  averageRating: number;
  placeId: string;
  googleReviews: Review[];
  lastGoogleSync: string | Date;
  website: string;
  brands: string[];
  city: string;
  ilce: string;
  appreviews: Review[];
  businessHours: string[];
  services: string[];
} 