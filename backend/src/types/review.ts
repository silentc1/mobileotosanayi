export interface Review {
  _id: string;
  businessId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  likes: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
} 