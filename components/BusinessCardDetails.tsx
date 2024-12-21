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

export type Business = {
  id?: string;
  _id: string;
  ownerId: string;
  name: string;
  category: string[];
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website?: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  placeId?: string;
  googleReviews?: Array<{
    rating: number;
    text: string;
    time: number;
    authorName: string;
  }>;
  lastGoogleSync?: string;
  city: string;
  ilce: string;
  brands: string[];
  appreviews?: Array<{
    rating: number;
    text: string;
    time: string;
    authorName: string;
  }>;
  businessHours?: Array<any>;
  reviews?: Array<any>;
  services?: Array<any>;
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
  const [newReview, setNewReview] = useState({ rating: 0, text: '', authorName: user?.name || 'Anonymous' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('Business details on mount:', {
        id: business.id || business._id,
        name: business.name,
        hasGoogleReviews: !!business.googleReviews,
        googleReviewsCount: business.googleReviews?.length,
        hasAppReviews: !!business.appreviews,
        appReviewsCount: business.appreviews?.length,
        reviewCount: business.reviewCount,
        rawGoogleReviews: business.googleReviews,
        rawAppReviews: business.appreviews,
        fullBusiness: business
      });
      loadReviews();
    }
  }, [visible, business.id || business._id]);

  const loadReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const fetchedReviews = await apiService.getBusinessReviews(business.id || business._id);
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

    if (!newReview.text.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir yorum yazın');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const response = await apiService.createReview({
        businessId: business.id || business._id,
        rating: newReview.rating,
        text: newReview.text,
        authorName: user?.name || 'Anonymous'
      });

      // Check if we got a rate limit response
      if (response?.error && response?.status === 429) {
        Alert.alert(
          'Haftalık Yorum Limiti',
          'Her işletme için haftada bir yorum yapabilirsiniz. Lütfen bir sonraki hafta tekrar deneyiniz.',
          [{ text: 'Tamam', style: 'default' }]
        );
        return;
      }

      // If successful, reset form and reload reviews
      setNewReview({ rating: 0, text: '', authorName: user?.name || 'Anonymous' });
      await loadReviews();
      Alert.alert('Başarılı', 'Yorumunuz başarıyla eklendi');
    } catch (error: any) {
      console.log('Review submission error:', error);
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

  const renderReviews = () => {
    console.log('Rendering reviews section with data:', {
      hasGoogleReviews: Boolean(business.googleReviews),
      googleReviewsCount: business.googleReviews?.length,
      hasAppReviews: Boolean(business.appreviews),
      appReviewsCount: business.appreviews?.length,
      rawGoogleReviews: business.googleReviews,
      rawAppReviews: business.appreviews,
      businessReviewCount: business.reviewCount,
      fullBusiness: business
    });

    if (isLoadingReviews) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <View>
        {/* Google Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewSourceHeader}>
            <FontAwesome name="google" size={16} color="#4285F4" />
            <Text style={styles.reviewSourceText}>Google Yorumları</Text>
            <Text style={styles.reviewCount}>
              ({business.reviewCount || 0} yorum)
            </Text>
          </View>
          
          {business.googleReviews && business.googleReviews.length > 0 ? (
            <>
              {business.googleReviews.map((review, index) => (
                <View key={`google-review-${index}`} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View style={[styles.avatarImage, styles.defaultAvatar]}>
                        <Text style={styles.avatarInitial}>
                          {review.authorName?.charAt(0) || 'A'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.reviewerName}>{review.authorName}</Text>
                        <Text style={styles.reviewDate}>
                          {formatDateToTurkish(review.time)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {renderRatingStars(review.rating || 0, 12)}
                      <Text style={styles.reviewRatingNumber}>
                        {typeof review.rating === 'number' ? review.rating.toFixed(1) : '0.0'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.text}</Text>
                </View>
              ))}
              {business.reviewCount > business.googleReviews.length && (
                <Text style={styles.moreReviewsText}>
                  +{business.reviewCount - business.googleReviews.length} yorum daha Google'da mevcut
                </Text>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome name="google" size={24} color="#4285F4" />
              <Text style={styles.emptyText}>Google yorumu bulunmuyor</Text>
              {business.reviewCount > 0 && (
                <Text style={styles.emptySubText}>
                  {business.reviewCount} yorum Google'da mevcut
                </Text>
              )}
            </View>
          )}
          
          {business.lastGoogleSync && (
            <Text style={styles.syncInfo}>
              Son güncelleme: {new Date(business.lastGoogleSync).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>

        {/* App Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewSourceHeader}>
            <FontAwesome name="comments" size={16} color="#333" />
            <Text style={styles.reviewSourceText}>Uygulama Yorumları</Text>
            <Text style={styles.reviewCount}>
              ({business.appreviews?.length || 0} yorum)
            </Text>
          </View>
          
          {business.appreviews && business.appreviews.length > 0 ? (
            <>
              {console.log('Rendering app reviews:', business.appreviews)}
              {business.appreviews.map((review, index) => {
                console.log('Rendering app review:', { index, review });
                return (
                  <View key={`app-review-${index}`} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={[styles.avatarImage, styles.defaultAvatar]}>
                          <Text style={styles.avatarInitial}>
                            {review.authorName?.charAt(0) || 'A'}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>{review.authorName || 'Anonim'}</Text>
                          <Text style={styles.reviewDate}>
                            {new Date(parseInt(review.time)).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewRating}>
                        {renderRatingStars(review.rating, 12)}
                        <Text style={styles.reviewRatingNumber}>
                          {review.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.text}</Text>
                  </View>
                );
              })}
            </>
          ) : (
            <>
              {console.log('No app reviews to display')}
              <View style={styles.emptyContainer}>
                <FontAwesome name="comments" size={32} color="#999" />
                <Text style={styles.emptyText}>Henüz yorum yapılmamış</Text>
                <Text style={styles.emptySubText}>İlk yorumu siz yapın!</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderMainInfo = () => (
    <View style={styles.mainInfo}>
      <Text style={styles.businessName}>{business.name}</Text>
      
      <View style={styles.ratingContainer}>
        <View style={styles.stars}>
          {renderRatingStars(business.rating)}
        </View>
        <Text style={styles.ratingNumber}>
          {business.rating ? business.rating.toFixed(1) : '0.0'}
        </Text>
        <Text style={styles.reviewCount}>
          ({business.reviewCount} Google reviews)
        </Text>
      </View>

      <View style={styles.infoRow}>
        <FontAwesome name="tag" size={16} color="#666" />
        <Text style={styles.infoText}>
          {Array.isArray(business.category) 
            ? business.category.join(', ')
            : business.category}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <FontAwesome name="map-marker" size={16} color="#666" />
        <Text style={styles.infoText}>{business.address}</Text>
      </View>

      {Array.isArray(business.brands) && business.brands.length > 0 && (
        <View style={styles.infoRow}>
          <FontAwesome name="building" size={16} color="#666" />
          <Text style={styles.infoText}>{business.brands.join(' • ')}</Text>
        </View>
      )}

      <Text style={styles.description}>{business.description}</Text>
    </View>
  );

  const formatDateToTurkish = (timestamp: number) => {
    const date = new Date(timestamp.toString().length === 13 ? timestamp : timestamp * 1000);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            {renderMainInfo()}

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
                <FontAwesome name="star" size={18} color="#333" />
                <Text style={styles.sectionTitle}>Yorumlar</Text>
              </View>

              {user && (
                <View style={styles.addReviewContainer}>
                  <Text style={styles.addReviewTitle}>Yorum Ekle</Text>
                  <View style={styles.ratingInput}>
                    {renderRatingStars(newReview.rating, 24, true)}
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Yorumunuzu buraya yazın..."
                    multiline
                    numberOfLines={4}
                    value={newReview.text}
                    onChangeText={(text) =>
                      setNewReview({ ...newReview, text: text })
                    }
                  />
                  <Text style={styles.anonymousNote}>* Yorumlarınız anonim olarak saklanacaktır</Text>
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
                      <Text style={styles.submitButtonText}>Yorum Gönder</Text>
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 16,
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
    padding: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginTop: 8,
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
  reviewsSection: {
    marginBottom: 20,
  },
  reviewSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  reviewSourceText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  syncInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  moreReviewsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptySubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  reviewRatingNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  anonymousNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
}); 