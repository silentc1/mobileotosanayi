import { ObjectId } from 'mongodb';

export interface Campaign {
  _id?: ObjectId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  images: string[];
  terms: string;
  features: string[];
  stockCount: number;
  dealerLocations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignDto {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  images: string[];
  terms: string;
  features: string[];
  stockCount: number;
  dealerLocations: string[];
}

export interface UpdateCampaignDto {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  images?: string[];
  terms?: string;
  features?: string[];
  stockCount?: number;
  dealerLocations?: string[];
}