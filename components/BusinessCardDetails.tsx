import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Linking,
  Share,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

type BusinessHours = {
  day: string;
  hours: string;
  isOpen: boolean;
};

type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

type Service = {
  id: string;
  name: string;
  price: string;
  description?: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website?: string;
  description: string;
  images: string[];
  businessHours: BusinessHours[];
  reviews: Review[];
  services: Service[];
  latitude: number;
  longitude: number;
};

type BusinessCardDetailsProps = {
  business: Business;
  visible: boolean;
  onClose: () => void;
  onFavoritePress?: (business: Business) => void;
  isFavorite?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BusinessCardDetails({
  business,
  visible,
  onClose,
  onFavoritePress,
  isFavorite = false,
}: BusinessCardDetailsProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL(`tel:${business.phone}`);
  };

  const handleDirection = () => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}?q=${business.name}&ll=${business.latitude},${business.longitude}`,
      android: `${scheme}${business.latitude},${business.longitude}?q=${business.name}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${business.name}\n${business.address}\n${business.phone}`,
        title: business.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
            onPress: () => {
              onClose();
              router.push('/login');
            },
          },
        ]
      );
      return;
    }

    if (onFavoritePress) {
      onFavoritePress(business);
    }
  };

  const handleReviewPress = () => {
    if (!user) {
      Alert.alert(
        'Giriş Yapın',
        'Yorum yapmak için giriş yapmanız gerekiyor.',
        [
          {
            text: 'Vazgeç',
            style: 'cancel',
          },
          {
            text: 'Giriş Yap',
            onPress: () => {
              onClose();
              router.push('/login');
            },
          },
        ]
      );
      return;
    }

    // Handle review submission
    console.log('Add review');
  };

  const renderRatingStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesome
        key={`star-${index}`}
        name={index < rating ? 'star' : 'star-o'}
        size={16}
        color={index < rating ? '#FFD700' : '#C4C4C4'}
        style={styles.starIcon}
      />
    ));
  };

  const renderImageGallery = () => {
    if (!business.images || business.images.length === 0) {
      return (
        <View key="no-image" style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/400x200?text=No+Image' }}
            style={styles.businessImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    return business.images.map((image, index) => (
      <View key={`image-${index}`} style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.businessImage}
          resizeMode="cover"
        />
        {business.images.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {index + 1}/{business.images.length}
            </Text>
          </View>
        )}
      </View>
    ));
  };

  const renderBusinessHours = () => {
    if (!business.businessHours || business.businessHours.length === 0) {
      return (
        <View key="no-hours" style={styles.emptyContainer}>
          <FontAwesome name="clock-o" size={32} color="#999" />
          <Text style={styles.emptyText}>No business hours available</Text>
        </View>
      );
    }

    return business.businessHours.map((schedule, index) => (
      <View key={`hours-${index}`} style={styles.scheduleRow}>
        <Text style={styles.scheduleDay}>{schedule.day}</Text>
        <View style={styles.scheduleStatus}>
          <View style={[styles.statusDot, schedule.isOpen ? styles.openDot : styles.closedDot]} />
          <Text style={[styles.scheduleHours, schedule.isOpen && styles.openHours]}>
            {schedule.hours}
          </Text>
        </View>
      </View>
    ));
  };

  const renderServices = () => {
    if (!business.services || business.services.length === 0) {
      return (
        <View key="no-services" style={styles.emptyContainer}>
          <FontAwesome name="list" size={32} color="#999" />
          <Text style={styles.emptyText}>No services available</Text>
        </View>
      );
    }

    return business.services.map((service) => (
      <View key={`service-${service.id}`} style={styles.serviceItem}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.servicePrice}>{service.price}</Text>
        </View>
        {service.description && (
          <Text style={styles.serviceDescription}>{service.description}</Text>
        )}
      </View>
    ));
  };

  const renderReviews = () => {
    if (!business.reviews || business.reviews.length === 0) {
      return (
        <View key="no-reviews" style={styles.emptyContainer}>
          <FontAwesome name="comments" size={32} color="#999" />
          <Text style={styles.emptyText}>Henüz yorum yok</Text>
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={handleReviewPress}
          >
            <Text style={styles.addReviewText}>İlk yorumu sen yap</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return business.reviews.map((review) => (
      <View key={`review-${review.id}`} style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={styles.reviewerAvatar}>
              <FontAwesome name="user-circle" size={24} color="#666" />
            </View>
            <View>
              <Text style={styles.reviewerName}>{review.userName}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          </View>
          <View style={styles.stars}>{renderRatingStars(review.rating)}</View>
        </View>
        <Text style={styles.reviewComment}>{review.comment}</Text>
      </View>
    ));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="chevron-down" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
          >
            <FontAwesome
              name={isFavorite ? 'heart' : 'heart-o'}
              size={24}
              color={isFavorite ? '#FF0000' : '#333'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
          >
            {renderImageGallery()}
          </ScrollView>

          <View style={styles.content}>
            <View style={styles.mainInfo}>
              <Text style={styles.businessName}>{business.name}</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>{renderRatingStars(business.rating)}</View>
                <Text style={styles.reviewCount}>({business.reviewCount} reviews)</Text>
              </View>
              <Text style={styles.category}>{business.category}</Text>
              <Text style={styles.description}>{business.description}</Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <View style={styles.actionButtonIcon}>
                  <FontAwesome name="phone" size={20} color="#fff" />
                </View>
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleDirection}>
                <View style={styles.actionButtonIcon}>
                  <FontAwesome name="map-marker" size={20} color="#fff" />
                </View>
                <Text style={styles.actionButtonText}>Direction</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <View style={styles.actionButtonIcon}>
                  <FontAwesome name="share" size={20} color="#fff" />
                </View>
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome name="clock-o" size={18} color="#333" />
                <Text style={styles.sectionTitle}>Business Hours</Text>
              </View>
              {renderBusinessHours()}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome name="list" size={18} color="#333" />
                <Text style={styles.sectionTitle}>Services</Text>
              </View>
              {renderServices()}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome name="comments" size={18} color="#333" />
                <Text style={styles.sectionTitle}>Reviews</Text>
              </View>
              {renderReviews()}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  closeButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  imageGallery: {
    height: 250,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 250,
    position: 'relative',
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  mainInfo: {
    marginBottom: 24,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewCount: {
    color: '#666',
    fontSize: 14,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleDay: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  openDot: {
    backgroundColor: '#4CAF50',
  },
  closedDot: {
    backgroundColor: '#FF5252',
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666',
  },
  openHours: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  serviceItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reviewItem: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    marginRight: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  addReviewButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  addReviewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 