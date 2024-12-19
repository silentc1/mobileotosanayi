import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import BusinessCardDetails from './BusinessCardDetails';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const DEFAULT_IMAGE = 'https://via.placeholder.com/400x200?text=No+Image';

export type Business = {
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
  placeId: string;
  googleReviews: Array<{
    rating: number;
    text: string;
    time: number;
    authorName: string;
  }>;
  lastGoogleSync: string;
  website: string;
  brands: string[];
  city: string;
  ilce: string;
};

type BusinessCardProps = {
  business: Business;
  onPress?: (business: Business) => void;
  onFavoritePress?: (business: Business) => void;
  isFavorite?: boolean;
};

export default function BusinessCard({
  business,
  onPress,
  onFavoritePress,
  isFavorite = false,
}: BusinessCardProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite);
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user) {
        try {
          const favorites = await apiService.getFavorites();
          console.log('Checking favorites for business:', business._id);
          console.log('Current favorites:', JSON.stringify(favorites, null, 2));
          
          // Check if favorites is an array and has items
          if (!Array.isArray(favorites)) {
            console.warn('Favorites is not an array:', favorites);
            return;
          }

          // Check both _id and direct comparison for flexibility
          const isFavorited = favorites.some(fav => {
            if (typeof fav === 'string') {
              return fav === business._id;
            }
            return fav._id === business._id;
          });
          
          console.log('Is business favorited:', isFavorited);
          setLocalIsFavorite(isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [user, business._id]);

  const handleFavoritePress = async () => {
    if (!user) {
      Alert.alert(
        'Giriş Yapın',
        'Favorilere eklemek için giriş yapmanız gerekiyor.',
        [
          {
            text: 'Vazgeç',
            style: 'cancel',
          },
          {
            text: 'Giriş Yap',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    try {
      setIsLoading(true);
      
      // Debug logging for business object
      console.log('Full business object:', JSON.stringify(business, null, 2));
      console.log('Business ID type:', typeof business._id);
      console.log('Business ID value:', business._id);
      
      // Check for valid business ID
      const businessId = business._id?.toString() || business.id?.toString();
      if (!businessId) {
        console.error('Invalid business object:', business);
        throw new Error('Business ID is missing');
      }
      
      if (localIsFavorite) {
        console.log('Removing from favorites...', { businessId });
        await apiService.removeFavorite(businessId);
      } else {
        console.log('Adding to favorites...', { businessId });
        await apiService.addFavorite(businessId);
      }
      
      // Toggle local state
      setLocalIsFavorite(!localIsFavorite);
      
      // Fetch updated favorites
      const updatedFavorites = await apiService.getFavorites();
      console.log('Updated favorites after operation:', JSON.stringify(updatedFavorites, null, 2));
      
      if (onFavoritePress) {
        onFavoritePress(business);
      }
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
      Alert.alert(
        'Hata',
        'Favori işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
      // Revert local state if there was an error
      setLocalIsFavorite(localIsFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    console.log('Full business data:', JSON.stringify(business, null, 2));
  }, [business]);

  const handlePress = () => {
    setIsDetailsVisible(true);
    if (onPress) {
      onPress(business);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <FontAwesome key={i} name="star" size={16} color="#FFD700" style={styles.star} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <FontAwesome key={i} name="star-half-o" size={16} color="#FFD700" style={styles.star} />
        );
      } else {
        stars.push(
          <FontAwesome key={i} name="star-o" size={16} color="#FFD700" style={styles.star} />
        );
      }
    }
    return stars;
  };

  const imageSource = business.images && business.images.length > 0 && !imageError
    ? { uri: business.images[0] }
    : { uri: DEFAULT_IMAGE };

  const mapBusinessToDetailsType = (business: Business): BusinessDetailsType => {
    // Safely handle the _id conversion
    const businessId = business._id?.toString() || business.id?.toString() || '';
    
    return {
      _id: business._id || '',
      id: businessId,
      name: business.name || '',
      category: business.category || [],
      rating: business.rating || business.averageRating || 0,
      reviewCount: business.reviewCount || 0,
      address: business.address || '',
      phone: business.phone || '',
      website: business.website || '',
      description: business.description || '',
      images: business.images || [],
      businessHours: business.businessHours || [],
      reviews: business.reviews || [],
      services: (business.services || []).map((service, index) => ({
        ...service,
        id: service.id || `${businessId}-service-${index}`
      })),
      latitude: business.latitude || 0,
      longitude: business.longitude || 0,
      city: business.city || '',
      ilce: business.ilce || '',
      brands: business.brands || [],
      placeId: business.placeId || '',
      googleReviews: business.googleReviews || [],
      lastGoogleSync: business.lastGoogleSync || '',
      appreviews: business.appreviews || [],
      ownerId: business.ownerId || '',
    };
  };

  // Add debug logging when business prop changes
  React.useEffect(() => {
    console.log('Business prop changed:', {
      id: business._id,
      name: business.name,
      hasId: !!business._id,
    });
  }, [business]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={styles.categoryBadge}>
          <FontAwesome name="tag" size={14} color="#000" style={styles.categoryIcon} />
          <Text style={styles.categoryText}>
            {Array.isArray(business.category) 
              ? business.category.join(', ')
              : business.category}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          disabled={isLoading}
        >
          <FontAwesome
            name={localIsFavorite ? 'heart' : 'heart-o'}
            size={24}
            color={localIsFavorite ? '#FF0000' : '#000'}
          />
        </TouchableOpacity>

        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.businessName} numberOfLines={1}>
            {business.name}
          </Text>

          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {renderStars(business.rating || 0)}
              <Text style={styles.ratingNumber}>
                {business.rating ? business.rating.toFixed(1) : '0.0'}
              </Text>
            </View>
            <Text style={styles.reviewCount}>({business.reviewCount || 0})</Text>
            <View style={styles.googleBadge}>
              <FontAwesome name="google" size={16} color="#4285F4" />
            </View>
          </View>

          {(business.city || business.ilce) && (
            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={16} color="#666" style={styles.locationIcon} />
              <Text style={styles.locationText} numberOfLines={1}>
                {[business.ilce, business.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {Array.isArray(business.brands) && business.brands.length > 0 && (
            <View style={styles.brandsRow}>
              <FontAwesome name="building" size={14} color="#666" style={styles.brandIcon} />
              <View style={styles.brandsContainer}>
                {business.brands.map((brand, index) => (
                  <Text key={brand} style={styles.brandText}>
                    {brand}
                    {index < business.brands.length - 1 && (
                      <Text style={styles.bulletPoint}> • </Text>
                    )}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <BusinessCardDetails
        business={mapBusinessToDetailsType(business)}
        visible={isDetailsVisible}
        onClose={handleCloseDetails}
        onFavoritePress={handleFavoritePress}
        isFavorite={localIsFavorite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    padding: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  star: {
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  googleBadge: {
    marginLeft: 2,
  },
  brandsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  brandIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  brandsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandText: {
    fontSize: 14,
    color: '#666',
  },
  bulletPoint: {
    color: '#666',
    marginHorizontal: 4,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
}); 