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
    reviews: [],
    services: (business.services || []).map((service, index) => ({
      ...service,
      id: service.id || `${business._id}-service-${index}`
    })),
    latitude: business.latitude,
    longitude: business.longitude,
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
      
      let results: MongoBusiness[];
      
      if (selectedCategory) {
        results = await apiService.getBusinessesByCategory(selectedCategory);
      } else {
        results = await apiService.getAllBusinesses();
      }
      
      // Apply additional filters on the results if needed
      let filteredResults = results;
      if (selectedCity) {
        filteredResults = filteredResults.filter(b => b.address.includes(selectedCity));
      }
      if (selectedDistrict) {
        filteredResults = filteredResults.filter(b => b.address.includes(selectedDistrict));
      }
      
      setBusinesses(filteredResults);
    } catch (err) {
      setError('Failed to fetch businesses. Please try again later.');
      console.error('Error fetching businesses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, selectedDistrict, selectedCategory]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleFilterChange = useCallback((filterType: FilterType, value: string) => {
    switch (filterType) {
      case 'city':
        setSelectedCity(value);
        setSelectedDistrict('');
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

  const handleRemoveFilters = useCallback(() => {
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedCategory('');
    setSelectedBrand('');
    setAvailableDistricts(getDistrictsForCity(''));
    fetchBusinesses();
  }, [fetchBusinesses]);

  const hasActiveFilters = selectedCity || selectedDistrict || selectedCategory || selectedBrand;

  const handleBusinessPress = useCallback((business: MongoBusiness) => {
    console.log('Business pressed:', business.name);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBusinesses();
    setRefreshing(false);
  }, [fetchBusinesses]);

  const renderHeader = () => (
    <>
      <BannerSlider />
      <PopularCategories 
        selectedCategory={selectedCategory}
        onCategoryPress={(category) => handleFilterChange('category', category.value)}
      />
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
    <View style={styles.container}>
      <Header />
      <View>
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
        />
        {hasActiveFilters && (
          <TouchableOpacity 
            style={styles.removeFiltersButton} 
            onPress={handleRemoveFilters}
          >
            <FontAwesome name="times-circle" size={16} color="#fff" />
            <Text style={styles.removeFiltersText}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={businesses}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
          <BusinessCard
            business={mapBusinessToCardBusiness(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No businesses found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  removeFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  removeFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
