export interface RecommendedBusiness {
  _id: string;
  id?: string;
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
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  city: string;
  ilce: string;
  brands: string[];
  placeId?: string;
  googleReviews?: Array<{
    rating: number;
    text: string;
    time: number;
    authorName: string;
  }>;
  lastGoogleSync?: string;
  website?: string;
  appreviews?: Array<{
    rating: number;
    text: string;
    time: string;
    authorName: string;
  }>;
  reviews?: Array<any>;
  businessHours?: Array<any>;
  services?: Array<any>;
} 