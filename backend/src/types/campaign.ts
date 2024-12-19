import { ObjectId } from 'mongodb';

export interface Campaign {
  _id?: ObjectId;
  title: string;
  description: string;
  image: string;
  brands: string[];
  discount: string;
  validUntil: Date;
  business: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface CreateCampaignDto {
  title: string;
  description: string;
  image: string;
  brands: string[];
  discount: string;
  validUntil: Date;
  business: string;
}

export interface UpdateCampaignDto {
  title?: string;
  description?: string;
  image?: string;
  brands?: string[];
  discount?: string;
  validUntil?: Date;
  business?: string;
  isActive?: boolean;
}