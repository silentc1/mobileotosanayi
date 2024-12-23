import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TextInput, RefreshControl, ImageBackground, StatusBar, Modal, Platform, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import CampaignButton from '../../components/CampaignButton';
import BusinessCard from '../../components/BusinessCard';
import BusinessCardDetails from '../../components/BusinessCardDetails';
import { Business } from '../../backend/src/types/business';

interface Campaign {
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

type RecommendedBusiness = {
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
};

const mapToRecommendedBusiness = (business: any): RecommendedBusiness => ({
  _id: business._id.toString(),
  ownerId: business.ownerId || '',
  name: business.name || '',
  category: business.category || [],
  rating: business.rating || 0,
  reviewCount: business.reviewCount || 0,
  address: business.address || '',
  phone: business.phone || '',
  description: business.description || '',
  images: business.images || [],
  latitude: business.latitude || 0,
  longitude: business.longitude || 0,
  createdAt: business.createdAt || new Date().toISOString(),
  updatedAt: business.updatedAt || new Date().toISOString(),
  averageRating: business.averageRating || business.rating || 0,
  city: business.city || '',
  ilce: business.ilce || '',
  brands: business.brands || [],
  placeId: business.placeId || '',
  googleReviews: business.googleReviews || [],
  lastGoogleSync: business.lastGoogleSync || '',
  website: business.website || '',
  appreviews: business.appreviews || [],
});

export default function LandingScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeUsers] = useState(50 + Math.floor(Math.random() * 20)); // Simulated active users
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [recommendedBusinesses, setRecommendedBusinesses] = useState<RecommendedBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<RecommendedBusiness | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const response = await apiService.getCampaigns();
      if (response && response.campaigns) {
        setCampaigns(response.campaigns);
      } else {
        console.warn('Invalid campaign data format received');
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCampaigns().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchRecommendedBusinesses = async () => {
      try {
        const response = await apiService.getAllBusinesses();
        // Instead of random selection, filter for specific businesses
        const recommendedNames = ['Yaren Otomotiv', 'Oto Mekanik', 'Oto Elektrik']; // Example business names
        const recommended = response
          .filter(business => recommendedNames.includes(business.name))
          .map(mapToRecommendedBusiness);
        
        // If we don't find all recommended businesses, use the first 3 from the response
        if (recommended.length < 3) {
          const remaining = response.slice(0, 3).map(mapToRecommendedBusiness);
          setRecommendedBusinesses(remaining);
        } else {
          setRecommendedBusinesses(recommended);
        }
      } catch (error) {
        console.error('Error fetching recommended businesses:', error);
      }
    };

    fetchRecommendedBusinesses();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isModalVisible) {
        handleCloseModal();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      backHandler.remove();
      // Cleanup all modal states
      setIsModalVisible(false);
      setSelectedBusiness(null);
      setShowCampaignsModal(false);
      setSelectedCampaign(null);
    };
  }, [isModalVisible]);

  const handleRecommendedBusinessPress = useCallback((business: RecommendedBusiness) => {
    setSelectedBusiness(business);
    // Small delay to ensure smooth animation
    setTimeout(() => {
      setIsModalVisible(true);
    }, 0);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    // Small delay before clearing the business to allow animation to complete
    setTimeout(() => {
      setSelectedBusiness(null);
    }, 100);
  }, []);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
          }
        >
          {/* Enhanced Header */}
          <LinearGradient
            colors={['#312E81', '#4338CA', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Ototus</Text>
                <View style={styles.betaBadge}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.betaBadgeGradient}
                  >
                    <Text style={styles.betaText}>BETA</Text>
                  </LinearGradient>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => router.push('/notifications')}
                >
                  <FontAwesome name="bell" size={22} color="#FFFFFF" />
                  {notifications > 0 && (
                    <View style={[styles.notificationBadge, { borderColor: '#312E81' }]}>
                      <Text style={styles.notificationCount}>{notifications}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.profileButton}
                  onPress={() => router.push('/profilim')}
                >
                  <FontAwesome name="user-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Hoş Geldiniz! 👋</Text>
              <Text style={styles.welcomeText}>
                Aracınız için en iyi hizmet ve fırsatlar burada
              </Text>
            </View>

            <View style={styles.quickAccessGrid}>
              <TouchableOpacity 
                style={styles.quickAccessButton}
                onPress={() => router.push('/acil')}
              >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#FF3B30' }]}>
                  <FontAwesome name="ambulance" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickAccessText}>Acil Yardım</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAccessButton}
                onPress={() => router.push('/cep-ustam')}
              >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#4F46E5' }]}>
                  <FontAwesome name="magic" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickAccessText}>Cep Ustam</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Active Campaigns Section - Horizontal Slider */}
          <View style={styles.campaignsSection}>
            <View style={styles.campaignHeaderSection}>
              <View style={styles.sectionHeaderMain}>
                <View style={styles.sectionTitleWrapper}>
                  <Text style={styles.sectionTitle}>Aktif Kampanyalar</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => setShowCampaignsModal(true)}
                >
                  <Text style={styles.viewAllText}>Tümünü Gör</Text>
                  <FontAwesome name="angle-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.campaignsScrollContainer}
            >
              {campaigns.map((campaign, index) => (
                <TouchableOpacity 
                  key={campaign._id} 
                  style={styles.campaignCard}
                  onPress={() => setSelectedCampaign(campaign)}
                >
                  <ImageBackground
                    source={{ uri: campaign.images[0] }}
                    style={styles.campaignBackground}
                    imageStyle={styles.campaignBackgroundImage}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                      style={styles.campaignGradient}
                    >
                      <View style={styles.campaignCardHeader}>
                        <Text style={styles.campaignTitle} numberOfLines={1}>
                          {campaign.vehicleBrand} {campaign.vehicleModel}
                        </Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>%{campaign.discountPercentage}</Text>
                        </View>
                      </View>
                      <Text style={styles.campaignDescription} numberOfLines={2}>
                        {campaign.description}
                      </Text>
                      <View style={styles.campaignFooter}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.campaignPrice}>
                            {campaign.discountedPrice.toLocaleString('tr-TR')} ₺
                          </Text>
                          <Text style={styles.campaignOriginalPrice}>
                            {campaign.originalPrice.toLocaleString('tr-TR')} ₺
                          </Text>
                        </View>
                        <View style={styles.campaignMetaInfo}>
                          <View style={styles.daysLeftBadge}>
                            <FontAwesome name="calendar" size={12} color="#FFFFFF" />
                            <Text style={styles.daysLeftText}>
                              Son {campaign.remainingDays} gün
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recommended Businesses Section */}
          <View style={styles.recommendedWrapper}>
            <View style={styles.sectionHeaderMain}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>Önerilen İşletmeler</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/isletmeler')}
              >
                <Text style={styles.viewAllText}>İşletmeleri Keşfedin</Text>
                <FontAwesome name="angle-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedSection}
              decelerationRate="fast"
              snapToInterval={336}
              snapToAlignment="start"
              pagingEnabled={false}
            >
              {recommendedBusinesses.map((business) => (
                <View key={business._id} style={styles.recommendedCard}>
                  <BusinessCard
                    business={business}
                    onPress={() => handleRecommendedBusinessPress(business)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Campaign Detail Modal */}
        {selectedCampaign && (
          <View style={styles.modalContainer}>
            <CampaignButton
              campaign={selectedCampaign}
              onClose={() => setSelectedCampaign(null)}
            />
          </View>
        )}

        {/* Add Campaign Modal */}
        {showCampaignsModal && (
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setShowCampaignsModal(false);
              setSelectedCampaign(null);
            }}
            statusBarTranslucent
          >
            <View style={styles.modalOverlay}>
              <Pressable 
                style={styles.modalOverlay} 
                onPress={() => setShowCampaignsModal(false)}
              >
                <Pressable 
                  onPress={(e) => e.stopPropagation()}
                  style={styles.modalContent}
                >
                  <View style={styles.dragHandle}>
                    <View style={styles.dragIndicator} />
                  </View>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => {
                        setShowCampaignsModal(false);
                        setSelectedCampaign(null);
                      }}
                    >
                      <FontAwesome name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Kampanyalar</Text>
                    <View style={styles.closeButton} />
                  </View>

                  <ScrollView style={styles.modalScroll}>
                    {campaigns.map((campaign, index) => (
                      <TouchableOpacity
                        key={campaign._id || index}
                        style={styles.campaignListItem}
                        onPress={() => {
                          setSelectedCampaign(campaign);
                          setShowCampaignsModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: campaign.images[0] }}
                          style={styles.campaignThumbnail}
                        />
                        <View style={styles.campaignListContent}>
                          <View style={styles.campaignListHeader}>
                            <Text style={styles.campaignListTitle} numberOfLines={1}>
                              {campaign.vehicleYear} {campaign.vehicleBrand} {campaign.vehicleModel}
                            </Text>
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>%{campaign.discountPercentage}</Text>
                            </View>
                          </View>
                          <Text style={styles.campaignListDescription} numberOfLines={2}>
                            {campaign.description}
                          </Text>
                          <View style={styles.campaignListFooter}>
                            <Text style={styles.remainingDays}>
                              {campaign.remainingDays} gün kaldı
                            </Text>
                            <Text style={styles.stockCount}>
                              Stok: {campaign.stockCount}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </View>
          </Modal>
        )}

        {selectedBusiness && (
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCloseModal}
            statusBarTranslucent
            onDismiss={handleCloseModal}
          >
            <Pressable 
              style={styles.modalOverlay} 
              onPress={handleCloseModal}
            >
              <Pressable 
                onPress={(e) => e.stopPropagation()}
                style={styles.modalContent}
              >
                <BusinessCardDetails
                  business={selectedBusiness}
                  visible={isModalVisible}
                  onClose={handleCloseModal}
                />
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  recommendedWrapper: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  sectionHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
  },
  sectionTitleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  recommendedSection: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  recommendedCard: {
    width: 300,
    marginRight: 16,
  },
  betaBadge: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  betaBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  betaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A55A2',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAccessButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickAccessIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickAccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  campaignsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  campaignHeaderSection: {
    paddingHorizontal: 0,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    height: 36,
    alignSelf: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  campaignsScrollContainer: {
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 8,
  },
  campaignCard: {
    width: 280,
    height: 200,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  campaignBackground: {
    width: '100%',
    height: '100%',
  },
  campaignBackgroundImage: {
    resizeMode: 'cover',
  },
  campaignGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  campaignCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  campaignDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  campaignPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  campaignOriginalPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  campaignMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  campaignListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  campaignThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  campaignListContent: {
    flex: 1,
  },
  campaignListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  campaignListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  campaignListDescription: {
    fontSize: 14,
    color: '#666666',
  },
  campaignListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  remainingDays: {
    fontSize: 14,
    color: '#666666',
  },
  stockCount: {
    fontSize: 14,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dragHandle: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
});