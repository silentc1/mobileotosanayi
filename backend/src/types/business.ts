import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  favorites?: ObjectId[]; // Favori işletmelerin ID'leri
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  rating: number;
  text: string;
  time: number;
  authorName: string;
  userId: string;
}

export interface YolYardim {
  yardim: boolean;
  gece: boolean;
  yaklasik: string;
  onayli: boolean;
}

export interface Business {
  _id: string | ObjectId;
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
  placeId: string;
  googleReviews: Review[];
  lastGoogleSync: string | Date;
  website: string;
  brands: string[];
  city: string;
  ilce: string;
  appreviews: Review[];
  yolYardim: YolYardim;
}

export interface CreateBusinessDto extends Omit<Business, '_id'> {}

export interface UpdateBusinessDto extends Partial<Business> {} 