import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import BusinessCard from '../../components/BusinessCard';
import FilterBar from '../../components/FilterBar';
import Header from '../../components/Header';
import BannerSlider from '../../components/BannerSlider';
import PopularCategories from '../../components/PopularCategories';
import { Business as MongoBusiness } from '../../services/mongodb';
import { apiService } from '../../services/api';
import { Business as CardBusiness } from '../../components/BusinessCardDetails';
import { CITIES, DISTRICTS, getDistrictsForCity } from '../../data/locations';

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
  { label: 'Çok Markalı', value: 'Çok Markalı' },
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
    await fetchBusinesses();
  }, [fetchBusinesses]);

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

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <BannerSlider />
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
        <Text style={styles.welcomeSubtitle}>Size en yakın ve en iyi hizmetleri keşfedin</Text>
      </View>
      <PopularCategories 
        selectedCategory={selectedCategory}
        onCategoryPress={(category) => handleFilterChange('category', category.value)}
      />
      <View style={styles.filterAndSortContainer}>
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
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortPicker(true)}
        >
          <FontAwesome name="sort" size={18} color="#007AFF" />
          <Text style={styles.sortButtonText}>
            {sortOption === 'rating_desc' ? 'En Yüksek Puan' :
             sortOption === 'rating_asc' ? 'En Düşük Puan' :
             sortOption === 'reviews_desc' ? 'En Çok Değerlendirme' :
             sortOption === 'reviews_asc' ? 'En Az Değerlendirme' :
             'Sıralama'}
          </Text>
        </TouchableOpacity>
      </View>
      {businesses.length > 0 && (
        <View style={styles.resultsHeader}>
          <View style={styles.resultsContent}>
            <FontAwesome name="search" size={16} color="#007AFF" style={styles.resultsIcon} />
            <Text style={styles.resultsCount}>
              {businesses.length} {businesses.length === 1 ? 'işletme' : 'işletme'} bulundu
            </Text>
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
      <Header />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>İşletmeler yükleniyor...</Text>
        </View>
      ) : (
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
                  <FontAwesome name="times-circle" size={16} color="#007AFF" style={styles.clearFiltersIcon} />
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
      )}
      {renderSortPicker()}
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
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContainer: {
    padding: 16,
    marginTop: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666666',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 8,
  },
  clearFiltersIcon: {
    marginRight: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterAndSortContainer: {
    padding: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  resultsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsIcon: {
    marginRight: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
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
});
