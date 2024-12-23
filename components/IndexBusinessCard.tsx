import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Dimensions, InteractionManager } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecommendedBusiness } from '../types/business';
import BusinessCardDetails from './BusinessCardDetails';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const IMAGE_ASPECT_RATIO = 16 / 9;
const IMAGE_HEIGHT = Math.floor(CARD_WIDTH / IMAGE_ASPECT_RATIO);
const CARD_HEIGHT = IMAGE_HEIGHT + 160; // Fixed height: image + content

interface IndexBusinessCardProps {
  business: RecommendedBusiness;
  onPress: () => void;
}

export default function IndexBusinessCard({ business, onPress }: IndexBusinessCardProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [localIsFavorite, setLocalIsFavorite] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handlePress = useCallback(() => {
    // Prevent interaction during transition
    if (isTransitioning) {
      return;
    }

    // Set transitioning state
    setIsTransitioning(true);

    // Use InteractionManager to handle the press after any animations
    InteractionManager.runAfterInteractions(() => {
      setIsDetailsVisible(true);
      if (onPress) {
        onPress();
      }

      // Reset transitioning state after a delay
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    });
  }, [isTransitioning, onPress]);

  const handleCloseDetails = useCallback(() => {
    // Prevent closing during transition
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);
    InteractionManager.runAfterInteractions(() => {
      setIsDetailsVisible(false);
      
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    });
  }, [isTransitioning]);

  const handleFavoritePress = () => {
    // This will be handled by BusinessCardDetails component
  };

  const mapBusinessToDetailsType = (business: RecommendedBusiness) => {
    return {
      _id: business._id || '',
      id: business._id || '',
      name: business.name || '',
      category: business.category || [],
      rating: business.rating || business.averageRating || 0,
      reviewCount: business.reviewCount || 0,
      address: business.address || '',
      phone: business.phone || '',
      website: business.website || '',
      description: business.description || '',
      images: business.images || [],
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
      createdAt: business.createdAt || new Date().toISOString(),
      updatedAt: business.updatedAt || new Date().toISOString(),
      averageRating: business.averageRating || 0,
      businessHours: [],
      reviews: [],
      services: []
    };
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isTransitioning && styles.transitioningContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.95}
      disabled={isTransitioning}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: business.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
          style={styles.imageGradient}
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {business.category[0] || 'Otomotiv'}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {business.name}
          </Text>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>
              {business.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({business.reviewCount})
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {business.description || 'şletme açıklaması bulunmamaktadır.'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <FontAwesome name="map-marker" size={14} color="#666666" />
            <Text style={styles.address} numberOfLines={1}>
              {business.ilce}, {business.city}
            </Text>
          </View>
          {business.brands && business.brands.length > 0 && (
            <View style={styles.brandsContainer}>
              <FontAwesome name="wrench" size={12} color="#666666" />
              <Text style={styles.brands} numberOfLines={1}>
                {business.brands.slice(0, 2).join(', ')}
                {business.brands.length > 2 ? ' +' + (business.brands.length - 2) : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={isTransitioning}
        >
          <FontAwesome name="phone" size={14} color="#FFFFFF" />
          <Text style={styles.buttonText}>Hemen Ulaş</Text>
        </TouchableOpacity>
      </View>

      <BusinessCardDetails
        business={mapBusinessToDetailsType(business)}
        visible={isDetailsVisible}
        onClose={handleCloseDetails}
        onFavoritePress={handleFavoritePress}
        isFavorite={localIsFavorite}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Math.floor(IMAGE_HEIGHT * 0.4),
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 2,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginVertical: 8,
    minHeight: 40, // Ensures consistent height for 2 lines
  },
  footer: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },
  brandsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brands: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  contactButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  transitioningContainer: {
    opacity: 0.7,
  },
}); 