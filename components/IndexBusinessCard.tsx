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
const IMAGE_ASPECT_RATIO = 21 / 9;
const IMAGE_HEIGHT = Math.floor(CARD_WIDTH / IMAGE_ASPECT_RATIO);
const CARD_HEIGHT = IMAGE_HEIGHT + 80;

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
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>
              {business.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({business.reviewCount})
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.tagRow}>
                <View style={[
                  styles.tagContainer, 
                  { 
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderColor: 'rgba(249, 115, 22, 0.2)'
                  }
                ]}>
                  <FontAwesome name="map-marker" size={12} color="#C2410C" />
                  <Text style={[styles.tagText, { color: '#C2410C' }]} numberOfLines={1}>
                    {business.ilce}
                  </Text>
                </View>
                
                {business.brands && business.brands.length > 0 && (
                  <View style={[
                    styles.tagContainer, 
                    { 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.2)'
                    }
                  ]}>
                    <FontAwesome name="car" size={12} color="#15803D" />
                    <Text style={[styles.tagText, { color: '#15803D' }]} numberOfLines={1}>
                      {business.brands.length} Marka
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handlePress}
            activeOpacity={0.8}
            disabled={isTransitioning}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.contactButtonGradient}
            >
              <FontAwesome name="phone" size={12} color="#FFFFFF" />
              <Text style={styles.buttonText}>İletişim</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <BusinessCardDetails
          business={mapBusinessToDetailsType(business)}
          visible={isDetailsVisible}
          onClose={handleCloseDetails}
          onFavoritePress={handleFavoritePress}
          isFavorite={localIsFavorite}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
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
    height: Math.floor(IMAGE_HEIGHT * 0.5),
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 12,
    letterSpacing: -0.3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 2,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'column',
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactButton: {
    overflow: 'hidden',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  transitioningContainer: {
    opacity: 0.7,
  },
}); 