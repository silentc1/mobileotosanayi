import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BusinessCardDetails, { Business } from './BusinessCardDetails';
import { useAuth } from '../contexts/AuthContext';

type BusinessCardProps = {
  business: Business;
  onPress?: (business: Business) => void;
  onFavoritePress?: (business: Business) => void;
  isFavorite?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32; // Full width minus padding

const DEFAULT_IMAGE = 'https://via.placeholder.com/400x200?text=No+Image';

export default function BusinessCard({
  business,
  onPress,
  onFavoritePress,
  isFavorite = false,
}: BusinessCardProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(business);
    } else {
      setIsDetailsVisible(true);
    }
  };

  const handleFavoritePress = () => {
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

    if (onFavoritePress) {
      onFavoritePress(business);
    }
  };

  const renderRatingStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesome
        key={`star-${index}`}
        name={index < rating ? 'star' : 'star-o'}
        size={12}
        color={index < rating ? '#FFD700' : '#C4C4C4'}
        style={styles.starIcon}
      />
    ));
  };

  const imageSource = business.images && business.images.length > 0 && !imageError
    ? { uri: business.images[0] }
    : { uri: DEFAULT_IMAGE };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
          <View style={styles.overlay}>
            <View style={styles.categoryBadge}>
              <FontAwesome name="tag" size={12} color="#fff" style={styles.categoryIcon} />
              <Text style={styles.categoryText}>{business.category}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome
              name={isFavorite ? 'heart' : 'heart-o'}
              size={20}
              color={isFavorite ? '#FF0000' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {business.name}
            </Text>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderRatingStars(business.rating)}
              </View>
              <Text style={styles.reviewCount}>
                ({business.reviewCount})
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.addressContainer}>
              <FontAwesome name="map-marker" size={14} color="#666" style={styles.icon} />
              <Text style={styles.address} numberOfLines={1}>
                {business.address}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="phone" size={16} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="share" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <BusinessCardDetails
        business={business}
        visible={isDetailsVisible}
        onClose={() => setIsDetailsVisible(false)}
        onFavoritePress={handleFavoritePress}
        isFavorite={isFavorite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    padding: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 