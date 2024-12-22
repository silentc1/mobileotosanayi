import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import BusinessCard from '../../components/BusinessCard';
import FilterBar from '../../components/FilterBar';
import Header from '../../components/Header';
import BannerSlider from '../../components/BannerSlider';
import PopularCategories from '../../components/PopularCategories';
import CampaignButton from '../../components/CampaignButton';
import { Business as MongoBusiness } from '../../services/mongodb';
import { apiService } from '../../services/api';
import { Business as CardBusiness } from '../../components/BusinessCardDetails';
import { CITIES, DISTRICTS, getDistrictsForCity } from '../../data/locations';
import { Campaign } from '../../components/CampaignButton';
import FloatingAssistant from '../../components/FloatingAssistant';

type FilterOption = {
  label: string;
  value: string;
};

type FilterType = 'city' | 'district' | 'category' | 'brand';

type SortOption = 'none' | 'rating_desc' | 'rating_asc' | 'reviews_desc' | 'reviews_asc';

const CATEGORIES: FilterOption[] = [
  { label: 'Tüm Kategoriler', value: '' },
  { label: 'Servisler', value: 'Servisler' },
  { label: 'Kaportacılar', value: 'Kaportacılar' },
  { label: 'Lastikçiler', value: 'Lastikçiler' },
  { label: 'Parçacılar', value: 'Parçacılar' },
  { label: 'Motorsikletciler', value: 'Motorsikletciler' },
  { label: 'Egzozcular', value: 'Egzozcular' },
  { label: 'Boyacılar', value: 'Boyacılar' },
  { label: 'Ekspertizler', value: 'Ekspertizler' },
  { label: 'Frenciler', value: 'Frenciler' },
  { label: 'Aksesuarcılar', value: 'Aksesuarcılar' },
  { label: 'Elektrikçiler', value: 'Elektrikçiler' },
  { label: 'Turbocular', value: 'Turbocular' },
  { label: 'Yazılımcılar', value: 'Yazılımcılar' },
  { label: 'Cam Film ve Kaplamacılar', value: 'Cam Film ve Kaplamacılar' },
  { label: 'Kilitciler', value: 'Kilitciler' },
  { label: 'Yıkamacılar', value: 'Yıkamacılar' },
  { label: 'Tunningciler', value: 'Tunningciler' },
  { label: 'Rot Balanscılar', value: 'Rot Balanscılar' },
  { label: 'Oto Kuaförler', value: 'Oto Kuaförler' },
  { label: 'Oto Döşemeciler', value: 'Oto Döşemeciler' },
  { label: 'Camcılar', value: 'Camcılar' },
  { label: 'Jantcılar', value: 'Jantcılar' }
];

const BRANDS: FilterOption[] = [
  { label: 'Tüm Markalar', value: '' },
  { label: 'Alfa Romeo', value: 'Alfa Romeo' },
  { label: 'Audi', value: 'Audi' },
  { label: 'BMW', value: 'BMW' },
  { label: 'Chevrolet', value: 'Chevrolet' },
  { label: 'Citroën', value: 'Citroën' },
  { label: 'Dacia', value: 'Dacia' },
  { label: 'Fiat', value: 'Fiat' },
  { label: 'Ford', value: 'Ford' },
  { label: 'Honda', value: 'Honda' },
  { label: 'Hyundai', value: 'Hyundai' },
  { label: 'Jaguar', value: 'Jaguar' },
  { label: 'Jeep', value: 'Jeep' },
  { label: 'Kia', value: 'Kia' },
  { label: 'Land Rover', value: 'Land Rover' },
  { label: 'Lexus', value: 'Lexus' },
  { label: 'Mazda', value: 'Mazda' },
  { label: 'Mercedes-Benz', value: 'Mercedes-Benz' },
  { label: 'Mini', value: 'Mini' },
  { label: 'Mitsubishi', value: 'Mitsubishi' },
  { label: 'Nissan', value: 'Nissan' },
  { label: 'Opel', value: 'Opel' },
  { label: 'Peugeot', value: 'Peugeot' },
  { label: 'Porsche', value: 'Porsche' },
  { label: 'Renault', value: 'Renault' },
  { label: 'Seat', value: 'Seat' },
  { label: 'Skoda', value: 'Skoda' },
  { label: 'Smart', value: 'Smart' },
  { label: 'Subaru', value: 'Subaru' },
  { label: 'Suzuki', value: 'Suzuki' },
  { label: 'Tesla', value: 'Tesla' },
  { label: 'Toyota', value: 'Toyota' },
  { label: 'Volkswagen', value: 'Volkswagen' },
  { label: 'Volvo', value: 'Volvo' },
  { label: 'TOGG', value: 'TOGG' },
  { label: 'Tofaş', value: 'Tofaş' },
  { label: 'Aston Martin', value: 'Aston Martin' },
  { label: 'Bentley', value: 'Bentley' },
  { label: 'Ferrari', value: 'Ferrari' },
  { label: 'Lamborghini', value: 'Lamborghini' },
  { label: 'Maserati', value: 'Maserati' },
  { label: 'McLaren', value: 'McLaren' },
  { label: 'Rolls-Royce', value: 'Rolls-Royce' },
  { label: 'Daihatsu', value: 'Daihatsu' },
  { label: 'Infiniti', value: 'Infiniti' },
  { label: 'Isuzu', value: 'Isuzu' },
  { label: 'SsangYong', value: 'SsangYong' },
  { label: 'Iveco', value: 'Iveco' },
  { label: 'MAN', value: 'MAN' },
  { label: 'Scania', value: 'Scania' },
  { label: 'Temsa', value: 'Temsa' },
  { label: 'Ducati', value: 'Ducati' },
  { label: 'Harley-Davidson', value: 'Harley-Davidson' },
  { label: 'Kawasaki', value: 'Kawasaki' },
  { label: 'KTM', value: 'KTM' },
  { label: 'Triumph', value: 'Triumph' },
  { label: 'Yamaha', value: 'Yamaha' },
  { label: 'BYD', value: 'BYD' },
  { label: 'Chery', value: 'Chery' },
  { label: 'Geely', value: 'Geely' },
  { label: 'Great Wall', value: 'Great Wall' },
  { label: 'MG', value: 'MG' }
];

const mapBusinessToCardBusiness = (business: MongoBusiness): CardBusiness => {
  return {
    id: business._id,
    name: business.name,
    category: business.category,
    rating: business.rating || business.averageRating || 0,
    reviewCount: business.reviewCount || 0,
    address: business.address,
    phone: business.phone,
    website: business.website,
    description: business.description,
    images: business.images || [],
    businessHours: business.businessHours || [],
    reviews: business.reviews || [],
    services: (business.services || []).map((service, index) => ({
      ...service,
      id: service.id || `${business._id}-service-${index}`
    })),
    latitude: business.latitude,
    longitude: business.longitude,
    city: business.city,
    ilce: business.ilce,
    brands: business.brands || [],
    placeId: business.placeId,
    googleReviews: business.googleReviews,
    lastGoogleSync: business.lastGoogleSync,
    appreviews: business.appreviews || [],
  };
};

export default function HomeScreen() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [businesses, setBusinesses] = useState<MongoBusiness[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<FilterOption[]>(getDistrictsForCity(''));
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await apiService.getAllBusinesses();
      
      // Apply filters
      let filteredResults = results;
      
      if (selectedCity) {
        filteredResults = filteredResults.filter(b => b.city === selectedCity);
      }
      
      if (selectedDistrict) {
        filteredResults = filteredResults.filter(b => b.ilce === selectedDistrict);
      }
      
      if (selectedCategory) {
        filteredResults = filteredResults.filter(b => 
          Array.isArray(b.category) && b.category.includes(selectedCategory)
        );
      }
      
      if (selectedBrand) {
        filteredResults = filteredResults.filter(b => 
          Array.isArray(b.brands) && b.brands.includes(selectedBrand)
        );
      }
      
      setBusinesses(filteredResults);
    } catch (err) {
      setError('Failed to fetch businesses. Please try again later.');
      console.error('Error fetching businesses:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, selectedDistrict, selectedCategory, selectedBrand]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const fetchActiveCampaigns = useCallback(async () => {
    try {
      console.log('Fetching campaigns...');
      const response = await apiService.getCampaigns();
      console.log('Campaign response:', response);
      
      if (response && response.campaigns) {
        // Filter active campaigns and transform dates
        const currentCampaigns = response.campaigns
          .filter((campaign: Campaign) => campaign.isActive)
          .map((campaign: Campaign) => ({
            ...campaign,
            remainingDays: Math.ceil(
              (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            ),
            formattedStartDate: new Date(campaign.startDate).toLocaleDateString('tr-TR'),
            formattedEndDate: new Date(campaign.endDate).toLocaleDateString('tr-TR'),
            savingsAmount: campaign.originalPrice - campaign.discountedPrice
          }));
        
        console.log('Active campaigns:', currentCampaigns);
        setActiveCampaigns(currentCampaigns);
      } else {
        console.log('No campaigns found in response');
        setActiveCampaigns([]);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setActiveCampaigns([]);
    }
  }, []);

  useEffect(() => {
    fetchActiveCampaigns();
  }, [fetchActiveCampaigns]);

  // Add debug log for activeCampaigns state
  useEffect(() => {
    console.log('Active campaigns state:', activeCampaigns);
  }, [activeCampaigns]);

  const handleFilterChange = useCallback((filterType: 'city' | 'district' | 'category' | 'brand', value: string) => {
    switch (filterType) {
      case 'city':
        setSelectedCity(value);
        setSelectedDistrict(''); // Reset district when city changes
        setAvailableDistricts(getDistrictsForCity(value));
        break;
      case 'district':
        setSelectedDistrict(value);
        break;
      case 'category':
        setSelectedCategory(value);
        break;
      case 'brand':
        setSelectedBrand(value);
        break;
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedCategory('');
    setSelectedBrand('');
    setAvailableDistricts(getDistrictsForCity(''));
  }, []);

  const handleBusinessPress = useCallback((business: MongoBusiness) => {
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBusinesses(), fetchActiveCampaigns()]);
    setRefreshing(false);
  }, [fetchBusinesses, fetchActiveCampaigns]);

  const sortBusinesses = (businesses: MongoBusiness[]): MongoBusiness[] => {
    const sortedBusinesses = [...businesses];
    
    switch (sortOption) {
      case 'rating_desc':
        return sortedBusinesses.sort((a, b) => 
          (b.rating || b.averageRating || 0) - (a.rating || a.averageRating || 0)
        );
      case 'rating_asc':
        return sortedBusinesses.sort((a, b) => 
          (a.rating || a.averageRating || 0) - (b.rating || b.averageRating || 0)
        );
      case 'reviews_desc':
        return sortedBusinesses.sort((a, b) => 
          (b.reviewCount || 0) - (a.reviewCount || 0)
        );
      case 'reviews_asc':
        return sortedBusinesses.sort((a, b) => 
          (a.reviewCount || 0) - (b.reviewCount || 0)
        );
      default:
        return sortedBusinesses;
    }
  };

  const renderSortPicker = () => {
    if (!showSortPicker) return null;

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortPicker(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSortPicker(false)}
              >
                <FontAwesome name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Sıralama</Text>
              <View style={styles.closeButton} />
            </View>
            <ScrollView>
              {[
                { label: 'Varsayılan Sıralama', value: 'none' },
                { label: 'Puan (Yüksekten Düşüğe)', value: 'rating_desc' },
                { label: 'Puan (Düşükten Yükseğe)', value: 'rating_asc' },
                { label: 'Değerlendirme Sayısı (Çoktan Aza)', value: 'reviews_desc' },
                { label: 'Değerlendirme Sayısı (Azdan Çoğa)', value: 'reviews_asc' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortOption === option.value && styles.selectedSortOption,
                  ]}
                  onPress={() => {
                    setSortOption(option.value as SortOption);
                    setShowSortPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortOption === option.value && styles.selectedSortOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortOption === option.value && (
                    <FontAwesome name="check" size={16} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCampaignsModal = () => {
    if (!showCampaignsModal) return null;

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCampaignsModal(false);
          setSelectedCampaign(null);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
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
              {activeCampaigns.map((campaign, index) => (
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
          </View>
        </View>
      </Modal>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Otosanayicim 🚘</Text>
        <Text style={styles.welcomeSubtitle}>
          Cebinizdeki Oto Sanayici
        </Text>
      </View>

      <BannerSlider />

      <View style={styles.campaignsButtonContainer}>
        <TouchableOpacity
          style={styles.campaignsButton}
          onPress={() => setShowCampaignsModal(true)}
          activeOpacity={0.8}
        >
          <FontAwesome name="tag" size={20} color="#FFFFFF" />
          <Text style={styles.campaignsButtonText}>
            Kampanyalar ({activeCampaigns.length})
          </Text>
          <FontAwesome name="chevron-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <PopularCategories 
          selectedCategory={selectedCategory}
          onCategoryPress={(category) => handleFilterChange('category', category.value)}
        />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Filtrele ve Keşfet</Text>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortPicker(true)}
          >
            <FontAwesome name="sort" size={16} color="#007AFF" />
            <Text style={styles.sortButtonText}>
              {sortOption === 'rating_desc' ? 'En Yüksek Puan' :
               sortOption === 'rating_asc' ? 'En Düşük Puan' :
               sortOption === 'reviews_desc' ? 'En Çok Değerlendirme' :
               sortOption === 'reviews_asc' ? 'En Az Değerlendirme' :
               'Sıralama'}
            </Text>
          </TouchableOpacity>
        </View>
        <FilterBar
          cities={CITIES}
          districts={availableDistricts}
          categories={CATEGORIES}
          brands={BRANDS}
          selectedCity={selectedCity}
          selectedDistrict={selectedDistrict}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </View>

      {businesses.length > 0 && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsContent}>
            <View style={styles.resultsInfo}>
              <FontAwesome name="search" size={16} color="#007AFF" />
              <Text style={styles.resultsCount}>
                {businesses.length} {businesses.length === 1 ? 'işletme' : 'işletme'} bulundu
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorTitle}>Bir Hata Oluştu</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBusinesses}>
          <FontAwesome name="refresh" size={16} color="#FFFFFF" style={styles.retryIcon} />
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Header />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>İşletmeler yükleniyor...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={sortBusinesses(businesses)}
            renderItem={({ item }) => (
              <BusinessCard
                business={mapBusinessToCardBusiness(item)}
                onPress={() => handleBusinessPress(item)}
              />
            )}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome name="search" size={48} color="#999" />
                <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
                <Text style={styles.emptyText}>
                  {selectedCity || selectedDistrict || selectedCategory || selectedBrand
                    ? 'Bu filtrelere uygun işletme bulunamadı'
                    : 'Henüz işletme bulunmamaktadır'}
                </Text>
                {(selectedCity || selectedDistrict || selectedCategory || selectedBrand) && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={handleClearFilters}
                  >
                    <FontAwesome name="times-circle" size={16} color="#007AFF" />
                    <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#007AFF"
                title="Yenileniyor..."
                titleColor="#666666"
              />
            }
            showsVerticalScrollIndicator={false}
          />
          {renderSortPicker()}
          {renderCampaignsModal()}
          {selectedCampaign && (
            <Modal
              visible={true}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setSelectedCampaign(null)}
            >
              <CampaignButton
                campaign={selectedCampaign}
                onClose={() => setSelectedCampaign(null)}
              />
            </Modal>
          )}
          <FloatingAssistant />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  campaignsButtonContainer: {
    paddingTop: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  campaignsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  campaignsButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  categoriesSection: {
    paddingTop: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  filterSection: {
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  resultsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  resultsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  mapViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  mapViewText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  selectedSortOption: {
    backgroundColor: '#F0F7FF',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  selectedSortOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryIcon: {
    marginRight: 4,
  },
  retryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  discountBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
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
});
