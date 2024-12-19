import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
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

  const renderHeader = () => (
    <>
      <BannerSlider />
      <PopularCategories 
        selectedCategory={selectedCategory}
        onCategoryPress={(category) => handleFilterChange('category', category.value)}
      />
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
      {businesses.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {businesses.length} {businesses.length === 1 ? 'işletme' : 'işletme'} bulundu
          </Text>
        </View>
      )}
    </>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBusinesses}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Header />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={businesses}
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
              <Text style={styles.emptyText}>
                {selectedCity || selectedDistrict || selectedCategory || selectedBrand
                  ? 'Bu filtrelere uygun işletme bulunamadı'
                  : 'İşletme bulunamadı'}
              </Text>
              {(selectedCity || selectedDistrict || selectedCategory || selectedBrand) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F8F8F8',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
