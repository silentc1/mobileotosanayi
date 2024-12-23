import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, RefreshControl, ImageBackground, StatusBar, Modal, Platform, Pressable, BackHandler, FlatList, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import CampaignButton from '../../components/CampaignButton';
import BusinessCard from '../../components/BusinessCard';
import BusinessCardDetails from '../../components/BusinessCardDetails';
import { Campaign, RecommendedBusiness } from '../../types/business';
import FloatingAssistant from '../../components/FloatingAssistant';
import { styles as baseStyles } from './styles/index.styles';
import IndexBusinessCard from '../../components/IndexBusinessCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Extend the base styles with new styles
const styles = StyleSheet.create({
  ...baseStyles,
  // Section Layout
  sectionWrapper: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
  },
  sectionHeaderMain: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  
  // Section Title Area
  sectionTitleWrapper: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    letterSpacing: -0.3,
    opacity: 0.9,
  },
  sectionHighlight: {
    color: '#0066CC',
    fontWeight: '600' as const,
  },
  
  // Business Card Container
  businessCardContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  businessCardGradient: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  // Card Indicators
  cardIndicators: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 16,
    marginBottom: 8,
    height: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 102, 204, 0.15)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#0066CC',
    width: 24,
  },
  
  // View All Button
  viewAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    marginRight: 8,
    letterSpacing: -0.2,
  },
});

const mapToRecommendedBusiness = (business: any): RecommendedBusiness => ({
  _id: business._id?.toString() ?? '',
  ownerId: business.ownerId ?? '',
  name: business.name ?? '',
  category: business.category ?? [],
  rating: business.rating ?? 0,
  reviewCount: business.reviewCount ?? 0,
  address: business.address ?? '',
  phone: business.phone ?? '',
  description: business.description ?? '',
  images: business.images ?? [],
  latitude: business.latitude ?? 0,
  longitude: business.longitude ?? 0,
  createdAt: business.createdAt ?? new Date().toISOString(),
  updatedAt: business.updatedAt ?? new Date().toISOString(),
  averageRating: business.averageRating ?? business.rating ?? 0,
  city: business.city ?? '',
  ilce: business.ilce ?? '',
  brands: business.brands ?? [],
  placeId: business.placeId ?? '',
  googleReviews: business.googleReviews ?? [],
  lastGoogleSync: business.lastGoogleSync ?? '',
  website: business.website ?? '',
  appreviews: business.appreviews ?? [],
  reviews: [],
  businessHours: [],
  services: []
});

export default function LandingScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeUsers] = useState(50 + Math.floor(Math.random() * 20));
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [recommendedBusinesses, setRecommendedBusinesses] = useState<RecommendedBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<RecommendedBusiness | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const recommendedListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await apiService.getCampaigns();
      if (response?.campaigns) {
        setCampaigns(response.campaigns);
      } else {
        console.warn('Invalid campaign data format received');
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  }, [fetchCampaigns]);

  const fetchRecommendedBusinesses = useCallback(async () => {
    try {
      const response = await apiService.getAllBusinesses();
      const recommendedNames = ['Yaren Otomotiv', 'Oto Mekanik', 'Oto Elektrik'];
      const recommended = response
        .filter(business => recommendedNames.includes(business.name))
        .map(mapToRecommendedBusiness);
      
      setRecommendedBusinesses(recommended.length >= 3 ? recommended : response.slice(0, 3).map(mapToRecommendedBusiness));
    } catch (error) {
      console.error('Error fetching recommended businesses:', error);
      setRecommendedBusinesses([]);
    }
  }, []);

  const handleRecommendedBusinessPress = useCallback((business: RecommendedBusiness) => {
    console.log('Business pressed:', business);
    setSelectedBusiness(business);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => setSelectedBusiness(null), 300);
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchRecommendedBusinesses();
  }, [fetchCampaigns, fetchRecommendedBusinesses]);

  useEffect(() => {
    const backAction = () => {
      if (isModalVisible) {
        handleCloseModal();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      backHandler.remove();
      setIsModalVisible(false);
      setSelectedBusiness(null);
      setShowCampaignsModal(false);
      setSelectedCampaign(null);
    };
  }, [isModalVisible, handleCloseModal]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const scrollInterval = setInterval(() => {
      if (recommendedBusinesses.length > 0) {
        const nextIndex = (currentIndex + 1) % recommendedBusinesses.length;
        const offset = nextIndex * SCREEN_WIDTH;
        
        // Clear any existing scroll timeout
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        // Set a new scroll timeout
        scrollTimeout = setTimeout(() => {
          recommendedListRef.current?.scrollToOffset({
            offset,
            animated: true
          });
          setCurrentIndex(nextIndex);
        }, 100);
      }
    }, 5000);

    return () => {
      clearInterval(scrollInterval);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [currentIndex, recommendedBusinesses.length]);

  const handleScrollEnd = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.floor(offset / SCREEN_WIDTH);
    if (currentIndex !== newIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#003366' }}>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066CC']} />
            }
          >
            {/* Enhanced Header */}
            <LinearGradient
              colors={['#003366', '#0066CC', '#0099FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.header, { marginBottom: 16 }]}
            >
              <View style={styles.headerTop}>
                <View style={styles.headerTitleContainer}>
                  <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Ototus</Text>
                  <View style={styles.betaBadge}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.betaBadgeGradient}
                    >
                      <Text style={[styles.betaText, { color: '#FFFFFF' }]}>BETA</Text>
                    </LinearGradient>
                  </View>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={[styles.notificationButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                    onPress={() => router.push('/notifications')}
                  >
                    <FontAwesome name="bell" size={22} color="#FFFFFF" />
                    {notifications > 0 && (
                      <View style={[styles.notificationBadge, { backgroundColor: '#FF3B30', borderColor: '#003366' }]}>
                        <Text style={styles.notificationCount}>{notifications}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.profileButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                    onPress={() => router.push('/profilim')}
                  >
                    <FontAwesome name="user-circle" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeTitle, { color: '#FFFFFF' }]}>Hoş Geldiniz! 👋</Text>
                <Text style={[styles.welcomeText, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                  Aracınız için en iyi hizmet ve fırsatlar burada
                </Text>
              </View>

              <View style={styles.quickAccessGrid}>
                <TouchableOpacity 
                  style={[styles.quickAccessButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                  onPress={() => router.push('/acil')}
                >
                  <View style={[styles.quickAccessIcon, { backgroundColor: '#FF3B30' }]}>
                    <FontAwesome name="ambulance" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.quickAccessText, { color: '#FFFFFF' }]}>Acil Yardım</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.quickAccessButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                  onPress={() => router.push('/cep-ustam')}
                >
                  <View style={[styles.quickAccessIcon, { backgroundColor: '#0099FF' }]}>
                    <FontAwesome name="magic" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.quickAccessText, { color: '#FFFFFF' }]}>Cep Ustam</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Rest of the content with white background */}
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16 }}>
              {/* Recommended Businesses Section */}
              <View style={[styles.sectionWrapper, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.sectionHeaderMain}>
                  <View style={styles.sectionTitleWrapper}>
                    <Text style={styles.sectionTitle}>Önerilen İşletmeler</Text>
                    <Text style={styles.sectionSubtitle}>
                      Aracınız için <Text style={styles.sectionHighlight}>profesyonel servis</Text> ve{' '}
                      <Text style={styles.sectionHighlight}>kaliteli hizmet</Text> sunan, müşteri memnuniyeti yüksek işletmeler
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.viewAllButton]}
                    onPress={() => router.push('/isletmeler')}
                  >
                    <Text style={styles.viewAllText}>Tümünü Gör</Text>
                    <FontAwesome name="angle-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  ref={recommendedListRef}
                  data={recommendedBusinesses}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                  bounces={false}
                  snapToInterval={SCREEN_WIDTH}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  contentContainerStyle={{ alignItems: 'center' }}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item: business }) => (
                    <View style={styles.businessCardContainer}>
                      <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.businessCardGradient}
                      >
                        <IndexBusinessCard
                          business={business}
                          onPress={() => handleRecommendedBusinessPress(business)}
                        />
                      </LinearGradient>
                      <View style={styles.cardIndicators}>
                        {recommendedBusinesses.map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.indicator,
                              currentIndex === index && styles.indicatorActive
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  onMomentumScrollEnd={handleScrollEnd}
                  onScrollEndDrag={(event) => {
                    const offset = event.nativeEvent.contentOffset.x;
                    const currentOffset = currentIndex * SCREEN_WIDTH;
                    
                    const isMovingLeft = offset > currentOffset;
                    const isMovingRight = offset < currentOffset;
                    
                    let targetIndex = currentIndex;
                    if (isMovingLeft && currentIndex < recommendedBusinesses.length - 1) {
                      targetIndex = currentIndex + 1;
                    } else if (isMovingRight && currentIndex > 0) {
                      targetIndex = currentIndex - 1;
                    }

                    const newOffset = targetIndex * SCREEN_WIDTH;
                    recommendedListRef.current?.scrollToOffset({
                      offset: newOffset,
                      animated: true
                    });
                    setCurrentIndex(targetIndex);
                  }}
                  getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                  })}
                />
              </View>

              {/* Active Campaigns Section */}
              <View style={styles.sectionWrapper}>
                <View style={styles.sectionHeaderMain}>
                  <View style={styles.sectionTitleWrapper}>
                    <Text style={styles.sectionTitle}>Aktif Kampanyalar</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.viewAllButton, { backgroundColor: '#0066CC' }]}
                    onPress={() => setShowCampaignsModal(true)}
                  >
                    <Text style={styles.viewAllText}>Tümünü Gör</Text>
                    <FontAwesome name="angle-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
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
            </View>
          </ScrollView>
        </View>
      </View>

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

      {/* Business Details Modal */}
      {selectedBusiness && isModalVisible && (
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModal}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={styles.modalOverlay} 
              onPress={handleCloseModal}
            >
              <Pressable 
                onPress={(e) => e.stopPropagation()}
                style={[styles.modalContent, { height: '90%' }]}
              >
                <View style={styles.dragHandle}>
                  <View style={styles.dragIndicator} />
                </View>
                <BusinessCardDetails
                  business={selectedBusiness}
                  visible={isModalVisible}
                  onClose={handleCloseModal}
                />
              </Pressable>
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Add FloatingAssistant */}
      <FloatingAssistant />
    </SafeAreaView>
  );
}