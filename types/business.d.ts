export interface Campaign {
  _id: string;
  title: string;
  description: string;
  images: string[];
  remainingDays: number;
  originalPrice: number;
  discountedPrice: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  discountPercentage: number;
  terms: string;
  features: string[];
  stockCount: number;
  dealerLocations: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  formattedStartDate?: string;
  formattedEndDate?: string;
  savingsAmount?: number;
}

export interface RecommendedBusiness {
  _id: string;
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
  placeId: string;
  googleReviews: Array<{
    rating: number;
    text: string;
    time: number;
    authorName: string;
  }>;
  lastGoogleSync: string;
  website: string;
  appreviews?: Array<{
    rating: number;
    text: string;
    time: string;
    authorName: string;
  }>;
} 