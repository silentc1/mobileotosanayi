import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Text,
  FlatList,
  Modal,
  Keyboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import PromoBanner from './PromoBanner';
import { apiService } from '../services/api';
import { Business } from '../services/mongodb';
import debounce from 'lodash/debounce';
import BusinessCardDetails from './BusinessCardDetails';

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const MIN_SEARCH_LENGTH = 3; // Minimum karakter sayısı

  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < MIN_SEARCH_LENGTH) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const businesses = await apiService.getAllBusinesses();
        const filteredBusinesses = businesses.filter(business => {
          const searchLower = query.toLowerCase();
          return (
            business.name.toLowerCase().includes(searchLower) ||
            business.category.some(cat => cat.toLowerCase().includes(searchLower)) ||
            business.brands.some(brand => brand.toLowerCase().includes(searchLower)) ||
            business.city.toLowerCase().includes(searchLower) ||
            business.ilce.toLowerCase().includes(searchLower)
          );
        });
        setSearchResults(filteredBusinesses);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length < MIN_SEARCH_LENGTH) {
      setShowResults(false);
      setSearchResults([]);
    } else if (text.length >= MIN_SEARCH_LENGTH) {
      performSearch(text);
    }
  };

  const handleBusinessPress = (business: Business) => {
    setShowResults(false);
    setSearchQuery('');
    Keyboard.dismiss();
    setSelectedBusiness(business);
    setShowBusinessDetails(true);
  };

  const handleCloseBusinessDetails = () => {
    setShowBusinessDetails(false);
    setSelectedBusiness(null);
  };

  const handleAuthPress = () => {
    if (user) {
      router.push('/profilim');
    } else {
      router.push('/login');
    }
  };

  const renderSearchResult = ({ item }: { item: Business }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleBusinessPress(item)}
    >
      <View style={styles.resultContent}>
        <Text style={styles.businessName}>{item.name}</Text>
        <View style={styles.businessInfo}>
          <Text style={styles.categoryText}>
            {item.category.join(', ')}
          </Text>
          <Text style={styles.locationText}>
            {item.city}, {item.ilce}
          </Text>
        </View>
      </View>
      <FontAwesome name="chevron-right" size={16} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
 
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="İşletme, kategori veya konum ara..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => {
              if (searchQuery.length >= MIN_SEARCH_LENGTH) {
                setShowResults(true);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
            >
              <FontAwesome name="times-circle" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuthPress}
          activeOpacity={0.7}
        >
          {user ? (
            <View style={styles.userContainer}>
              <Text style={styles.userName}>{user.fullName.split(' ')[0]}</Text>
              <FontAwesome name="user-circle" size={24} color="#007AFF" />
            </View>
          ) : (
            <View style={styles.userContainer}>
              <Text style={styles.loginText}>Giriş Yap</Text>
              <FontAwesome name="user-circle-o" size={24} color="#666" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showResults && searchQuery.length >= MIN_SEARCH_LENGTH}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowResults(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowResults(false);
          }}
        >
          <View style={[styles.resultsContainer, { maxHeight: '60%' }]}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Aranıyor...</Text>
              </View>
            ) : searchQuery.length < MIN_SEARCH_LENGTH ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  Aramak için en az {MIN_SEARCH_LENGTH} karakter girin
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item._id.toString()}
                keyboardShouldPersistTaps="always"
                onScrollBeginDrag={Keyboard.dismiss}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>Sonuç bulunamadı</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {selectedBusiness && (
        <BusinessCardDetails
          business={{
            id: selectedBusiness._id,
            name: selectedBusiness.name,
            category: selectedBusiness.category,
            rating: selectedBusiness.rating || selectedBusiness.averageRating || 0,
            reviewCount: selectedBusiness.reviewCount || 0,
            address: selectedBusiness.address,
            phone: selectedBusiness.phone,
            website: selectedBusiness.website,
            description: selectedBusiness.description,
            images: selectedBusiness.images || [],
            businessHours: selectedBusiness.businessHours || [],
            reviews: selectedBusiness.reviews || [],
            services: (selectedBusiness.services || []).map((service, index) => ({
              ...service,
              id: service.id || `${selectedBusiness._id}-service-${index}`
            })),
            latitude: selectedBusiness.latitude,
            longitude: selectedBusiness.longitude,
            city: selectedBusiness.city,
            ilce: selectedBusiness.ilce,
            brands: selectedBusiness.brands || [],
            placeId: selectedBusiness.placeId,
            googleReviews: selectedBusiness.googleReviews,
            lastGoogleSync: selectedBusiness.lastGoogleSync,
            appreviews: selectedBusiness.appreviews || [],
          }}
          visible={showBusinessDetails}
          onClose={handleCloseBusinessDetails}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingTop: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: Platform.select({
      ios: 0,
      android: 6,
    }),
  },
  clearButton: {
    padding: 4,
  },
  authButton: {
    padding: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  resultsContainer: {
    backgroundColor: 'white',
    marginTop: Platform.OS === 'ios' ? 120 : 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultContent: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
}); 