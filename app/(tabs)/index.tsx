import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BusinessCard from '../../components/BusinessCard';
import FilterBar from '../../components/FilterBar';
import Header from '../../components/Header';
import BannerSlider from '../../components/BannerSlider';
import PopularCategories from '../../components/PopularCategories';
import { Business as MongoBusiness } from '../../services/mongodb';
import { apiService } from '../../services/api';
import { Business as CardBusiness } from '../../components/BusinessCardDetails';

type FilterOption = {
  label: string;
  value: string;
};

type FilterType = 'city' | 'district' | 'category' | 'brand';

const CITIES: FilterOption[] = [
  { label: 'Tüm Şehirler', value: '' },
  { label: 'İstanbul', value: 'İstanbul' },
];

const DISTRICTS: FilterOption[] = [
  { label: 'Tüm İlçeler', value: '' },
  { label: 'Kadıköy', value: 'Kadıköy' },
  { label: 'Beşiktaş', value: 'Beşiktaş' },
  { label: 'Ümraniye', value: 'Ümraniye' },
];

const CATEGORIES: FilterOption[] = [
  { label: 'Tüm Kategoriler', value: '' },
  { label: 'Servisler', value: 'Servisler' },
  { label: 'Kaportacılar', value: 'Kaportacılar' },
  { label: 'Lastikçiler', value: 'Lastikçiler' },
];

const BRANDS: FilterOption[] = [
  { label: 'Tüm Markalar', value: '' },
  { label: 'Çok Markalı', value: 'Çok Markalı' },
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
      <PopularCategories />
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
      <FilterBar
        cities={CITIES}
        districts={DISTRICTS}
        categories={CATEGORIES}
        brands={BRANDS}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        onFilterChange={handleFilterChange}
      />
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
});
