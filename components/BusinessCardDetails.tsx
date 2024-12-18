import React, { useState, useEffect } from 'react';
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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { apiService } from '../services/api';
import { Review } from '../services/mongodb';

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (visible) {
      loadReviews();
    }
  }, [visible, business.id]);

  const loadReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const fetchedReviews = await apiService.getBusinessReviews(business.id);
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setIsLoadingReviews(false);
    }
  };

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

  const handleReviewSubmit = async () => {
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

    if (newReview.rating === 0) {
      Alert.alert('Uyarı', 'Lütfen bir puan seçin');
      return;
    }

    if (!newReview.comment.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir yorum yazın');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await apiService.createReview({
        businessId: business.id,
        rating: newReview.rating,
        comment: newReview.comment,
      });

      // Reset form and reload reviews
      setNewReview({ rating: 0, comment: '' });
      await loadReviews();
      Alert.alert('Başarılı', 'Yorumunuz başarıyla eklendi');
    } catch (error: any) {
      // Check for rate limit error
      if (error?.response?.status === 429) {
        Alert.alert(
          'Haftalık Yorum Limiti',
          'Her işletme için haftada bir yorum yapabilirsiniz. Lütfen bir sonraki hafta tekrar deneyiniz.',
          [{ text: 'Anladım', style: 'default' }]
        );
        return;
      }

      // Handle other errors
      Alert.alert(
        'Uyarı',
        'Yorum gönderilemedi. Lütfen daha sonra tekrar deneyiniz.',
        [{ text: 'Tamam', style: 'default' }]
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewLike = async (reviewId: string) => {
    if (!user) {
      Alert.alert('Giriş Yapın', 'Beğenmek için giriş yapmanız gerekiyor.');
      return;
    }

    try {
      await apiService.likeReview(reviewId);
      await loadReviews();
    } catch (error) {
      console.error('Error liking review:', error);
      Alert.alert('Hata', 'Beğeni eklenirken bir hata oluştu');
    }
  };

  const renderRatingStars = (rating: number, size = 16, interactive = false) => {
    return [...Array(5)].map((_, index) => (
      <TouchableOpacity
        key={`star-${index}`}
        onPress={() => interactive && setNewReview({ ...newReview, rating: index + 1 })}
        disabled={!interactive}
      >
        <FontAwesome
          name={index < rating ? 'star' : 'star-o'}
          size={size}
          color={index < rating ? '#FFD700' : '#C4C4C4'}
          style={styles.starIcon}
        />
      </TouchableOpacity>
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

  const renderServices = () => {
    if (!business.services || business.services.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome name="list" size={32} color="#999" />
          <Text style={styles.emptyText}>Henüz hizmet eklenmemiş</Text>
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
    if (isLoadingReviews) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (!reviews || reviews.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comments" size={32} color="#999" />
          <Text style={styles.emptyText}>Henüz yorum yok</Text>
        </View>
      );
    }

    return reviews.map((review) => (
      <View key={`review-${review._id}`} style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={styles.reviewerAvatar}>
              {review.userAvatar ? (
                <Image
                  source={{ uri: review.userAvatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarImage, styles.defaultAvatar]}>
                  <Text style={styles.avatarInitial}>A</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.reviewerName}>Anonymous</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.reviewRating}>
            {renderRatingStars(review.rating, 12)}
          </View>
        </View>
        <Text style={styles.reviewComment}>{review.comment}</Text>
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleReviewLike(review._id)}
          >
            <FontAwesome name="thumbs-up" size={14} color="#666" />
            <Text style={styles.likeCount}>{review.likes}</Text>
          </TouchableOpacity>
        </View>
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
                <View style={styles.stars}>
                  {renderRatingStars(business.rating)}
                </View>
                <Text style={styles.reviewCount}>
                  ({business.reviewCount} reviews)
                </Text>
              </View>
              <Text style={styles.category}>{business.category}</Text>
              <Text style={styles.description}>{business.description}</Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCall}
              >
                <View style={styles.actionButtonIcon}>
                  <FontAwesome name="phone" size={20} color="#fff" />
                </View>
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDirection}
              >
                <View style={styles.actionButtonIcon}>
                  <FontAwesome name="map-marker" size={20} color="#fff" />
                </View>
                <Text style={styles.actionButtonText}>Direction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <View style={styles.actionButtonIcon}>
                  <FontAwesome name="share" size={20} color="#fff" />
                </View>
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
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

              {user && (
                <View style={styles.addReviewContainer}>
                  <Text style={styles.addReviewTitle}>Add a Review</Text>
                  <View style={styles.ratingInput}>
                    {renderRatingStars(newReview.rating, 24, true)}
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write your review here..."
                    multiline
                    numberOfLines={4}
                    value={newReview.comment}
                    onChangeText={(text) =>
                      setNewReview({ ...newReview, comment: text })
                    }
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isSubmittingReview && styles.submitButtonDisabled,
                    ]}
                    onPress={handleReviewSubmit}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Submit Review</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

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
    bottom: 16,
    right: 16,
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
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
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
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  addReviewContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  ratingInput: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  defaultAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 