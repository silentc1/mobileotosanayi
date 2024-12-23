import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import FilterModal from '../components/FilterModal';
import BusinessCardDetails, { Business as CardBusiness } from '../../components/BusinessCardDetails';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation, usePathname } from 'expo-router';
import { Tabs } from 'expo-router';
import FloatingAssistant from '../../components/FloatingAssistant';

const { width } = Dimensions.get('window');

interface RawBusiness {
  _id: { $oid: string } | string;
  name: string;
  category: string | string[];
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  placeId: string;
  googleReviews?: Array<{
    rating: number;
    text: string;
    time: { $numberLong: string };
    authorName: string;
  }>;
  lastGoogleSync?: string | Date;
  website?: string;
  brands?: string[];
  city: string;
  ilce: string;
  appreviews?: Array<{
    rating: number;
    text: string;
    authorName: string;
    time: { $numberLong: string };
  }>;
  yolYardim: {
    yardim: boolean;
    gece: boolean;
    yaklasik: string;
    onayli: boolean;
  };
  businessHours?: string[];
  services?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  ownerId?: string;
  averageRating?: number;
}

const mapBusinessToCardBusiness = (business: RawBusiness): CardBusiness => {
  const mongoId = typeof business._id === 'object' && business._id !== null && '$oid' in business._id 
    ? business._id.$oid 
    : String(business._id);

  return {
    id: mongoId,
    _id: mongoId,
    ownerId: business.ownerId || 'unknown',
    name: business.name,
    category: Array.isArray(business.category) ? business.category : [business.category],
    rating: business.rating || business.averageRating || 0,
    reviewCount: business.reviewCount || 0,
    address: business.address,
    phone: business.phone,
    website: business.website,
    description: business.description,
    images: business.images || [],
    latitude: business.latitude,
    longitude: business.longitude,
    city: business.city,
    ilce: business.ilce,
    brands: business.brands || [],
    placeId: business.placeId,
    googleReviews: business.googleReviews?.map(review => ({
      rating: review.rating,
      text: review.text,
      time: review.time ? Number(review.time.$numberLong || review.time) : Date.now(),
      authorName: review.authorName
    })) || [],
    lastGoogleSync: business.lastGoogleSync ? new Date(business.lastGoogleSync).toISOString() : undefined,
    appreviews: business.appreviews?.map(review => ({
      rating: review.rating,
      text: review.text,
      time: review.time ? String(review.time.$numberLong || review.time) : String(Date.now()),
      authorName: review.authorName
    })) || [],
    businessHours: business.businessHours || [],
    reviews: [],
    services: business.services || [],
    createdAt: business.createdAt ? new Date(business.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: business.updatedAt ? new Date(business.updatedAt).toISOString() : new Date().toISOString(),
    averageRating: business.rating || 0
  };
};

export default function AcilScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const [services, setServices] = useState<RawBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationGeocodedAddress | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{
    city?: string;
    district?: string;
    categories: string[];
  }>({
    categories: []
  });
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<CardBusiness | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  useEffect(() => {
    if (pathname !== '/(tabs)/acil') {
      setPreviousScreen(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const backAction = () => {
      router.navigate('index');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli',
          'Size en yakın servisleri gösterebilmemiz için konum izni vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode[0]) {
        setUserLocation(geocode[0]);
        console.log('Konum detayları:', {
          city: geocode[0].city,
          district: geocode[0].district,
          subregion: geocode[0].subregion,
          region: geocode[0].region,
          country: geocode[0].country,
          isoCountryCode: geocode[0].isoCountryCode,
          postalCode: geocode[0].postalCode,
          name: geocode[0].name,
          street: geocode[0].street,
          timezone: geocode[0].timezone
        });

        const cityName = geocode[0].region || geocode[0].subregion || geocode[0].city || '';
        if (cityName) {
          console.log('Bulunan şehir:', cityName);
          loadServices({ city: cityName });
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Hata',
        'Konum bilginiz alınamadı. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
      setIsLoading(false);
    }
  };

  const normalizeCity = (city: string): string => {
    return city
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'i')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 's')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'u')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'c')
      .toLowerCase()
      .replace(/^[a-z]/, letter => letter.toUpperCase());
  };

  const loadServices = async (params: { city?: string; district?: string; categories?: string[] }) => {
    try {
      setIsLoading(true);
      console.log('Filtreleme parametreleri:', params);
      
      let formattedCity = params.city;
      if (formattedCity) {
        formattedCity = normalizeCity(formattedCity);
      }

      console.log('Formatlanmış şehir:', formattedCity);
      
      const rawData = await apiService.getAllBusinesses();
      const rawBusinesses = (Array.isArray(rawData) ? rawData : []) as unknown as RawBusiness[];
      
      const response: { businesses: RawBusiness[] } = { 
        businesses: rawBusinesses
          .filter(b => b.yolYardim?.yardim === true)
          .map(b => {
            const mongoId = typeof b._id === 'object' && b._id !== null && '$oid' in b._id ? b._id.$oid : String(b._id);
            
            // Convert Google reviews
            const googleReviews = (b.googleReviews || []).map(review => ({
              rating: review.rating,
              text: review.text,
              time: Number(review.time.$numberLong),
              authorName: review.authorName
            }));

            // Convert app reviews
            const appReviews = (b.appreviews || []).map(review => ({
              rating: review.rating,
              text: review.text,
              time: review.time.$numberLong,
              authorName: review.authorName
            }));
            
            const business: RawBusiness = {
              _id: mongoId,
              name: b.name,
              category: Array.isArray(b.category) ? b.category : [b.category],
              rating: b.rating,
              reviewCount: b.reviewCount,
              address: b.address,
              phone: b.phone,
              description: b.description,
              images: b.images,
              latitude: b.latitude,
              longitude: b.longitude,
              placeId: b.placeId,
              city: b.city,
              ilce: b.ilce,
              lastGoogleSync: b.lastGoogleSync ? new Date(b.lastGoogleSync).toISOString() : undefined,
              googleReviews,
              brands: b.brands || [],
              appreviews: appReviews,
              businessHours: b.businessHours || [],
              services: b.services || [],
              createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
              yolYardim: b.yolYardim || { yardim: false, gece: false, yaklasik: '', onayli: false },
              website: b.website,
              averageRating: b.rating || 0
            };
            return business;
          })
      };
      
      let filteredServices = response.businesses.filter(business => {
        if (formattedCity && business.city !== formattedCity) return false;
        if (params.district && business.ilce !== params.district) return false;
        if (params.categories && params.categories.length > 0) {
          return params.categories.some(cat => business.category.includes(cat));
        }
        return true;
      });
      
      setServices(filteredServices);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices({});
  }, []);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const rawData = await apiService.getAllBusinesses();
        const rawBusinesses = (Array.isArray(rawData) ? rawData : []) as unknown as RawBusiness[];
        
        const acilBusinesses = rawBusinesses
          .filter(b => Array.isArray(b.category) ? b.category.includes('acil') : b.category === 'acil')
          .map(b => {
            const mongoId = typeof b._id === 'object' && b._id !== null && '$oid' in b._id ? b._id.$oid : String(b._id);
            
            const business: RawBusiness = {
              _id: mongoId,
              name: b.name,
              category: Array.isArray(b.category) ? b.category : [b.category],
              rating: b.rating,
              reviewCount: b.reviewCount,
              address: b.address,
              phone: b.phone,
              description: b.description,
              images: b.images,
              latitude: b.latitude,
              longitude: b.longitude,
              placeId: b.placeId,
              city: b.city,
              ilce: b.ilce,
              lastGoogleSync: b.lastGoogleSync ? new Date(b.lastGoogleSync).toISOString() : undefined,
              googleReviews: b.googleReviews || [],
              brands: b.brands || [],
              appreviews: b.appreviews || [],
              businessHours: b.businessHours || [],
              services: b.services || [],
              createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
              yolYardim: b.yolYardim || { yardim: false, gece: false, yaklasik: '', onayli: false },
              website: b.website
            };
            return business;
          });
        
        const cities = [...new Set(acilBusinesses.map(b => b.city))];
        const districts = [...new Set(acilBusinesses.map(b => b.ilce))];
        const businessTypes = [...new Set(acilBusinesses.flatMap(b => b.category))];
        
        setAvailableCities(cities);
        setAvailableDistricts(districts);
        setAvailableCategories(businessTypes);
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  const getCurrentBusinessHours = (business: RawBusiness): boolean => {
    if (business.yolYardim.gece) {
      return true; // 24 saat açık
    }
    
    const now = new Date();
    const hour = now.getHours();
    
    // 08:00 - 20:00 arası açık
    return hour >= 8 && hour < 20;
  };

  const getServicePrice = (business: RawBusiness): string => {
    return business.yolYardim.yaklasik ? `${business.yolYardim.yaklasik}₺` : 'Belirtilmemiş';
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (userLocation?.region) {
      loadServices({
        city: userLocation.region,
        district: userLocation.city || undefined,
        categories: selectedFilters.categories || undefined
      });
    } else if (userLocation?.subregion) {
      loadServices({
        city: userLocation.subregion,
        district: userLocation.city || undefined,
        categories: selectedFilters.categories || undefined
      });
    } else {
      loadServices({});
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleSMS = (phoneNumber: string) => {
    if (!userLocation) {
      Alert.alert(
        'Konum Gerekli',
        'Lütfen Konum Bilgilerinizi Yukarıdan Bizimle Paylaşın',
        [{ text: 'Tamam' }]
      );
      return;
    }

    const locationText = `${userLocation.street || ''} ${userLocation.name || ''} ${userLocation.district || ''} ${userLocation.city || ''} ${userLocation.region || userLocation.subregion || ''}`.trim().replace(/\s+/g, ' ');

    const message = encodeURIComponent(
      `Yolda kaldım yardıma ihtiyacım var.\nKonumum: ${locationText}`
    );
    
    Linking.openURL(`sms:${phoneNumber}?body=${message}`);
  };

  const handleFilterApply = (filters: { city?: string; district?: string; categories: string[] }) => {
    setSelectedFilters(filters);
    loadServices(filters);
  };

  const handleBackPress = () => {
    router.navigate('index');
  };

  const handleCardPress = (business: RawBusiness) => {
    console.log('Card pressed, raw business:', business);
    const mappedBusiness = mapBusinessToCardBusiness(business);
    console.log('Mapped business:', mappedBusiness);
    setSelectedBusiness(mappedBusiness);
    setIsDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    console.log('Closing details modal');
    setIsDetailsVisible(false);
    setSelectedBusiness(null);
  };

  const renderServiceCard = (business: RawBusiness) => (
    <TouchableOpacity 
      key={business._id.toString()} 
      style={[
        styles.card,
        !getCurrentBusinessHours(business) && styles.closedCard
      ]}
      activeOpacity={0.95}
      onPress={() => {
        console.log('Card TouchableOpacity pressed');
        handleCardPress(business);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.serviceTypeContainer}>
          <View style={[styles.statusIndicator, getCurrentBusinessHours(business) ? styles.openIndicator : styles.closedIndicator]} />
          <View>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.serviceType}>{business.category[0]}</Text>
          </View>
        </View>
        {business.yolYardim.onayli && (
          <View style={styles.verifiedBadge}>
            <FontAwesome name="check-circle" size={14} color="#22C55E" />
            <Text style={styles.verifiedText}>Onaylı</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={16} color="#64748B" />
          <Text style={styles.locationText}>{business.ilce}, {business.city}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Yaklaşık Ücret</Text>
            <Text style={styles.priceValue}>{getServicePrice(business)}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Durum</Text>
            <View style={[styles.statusBadge, getCurrentBusinessHours(business) ? styles.openBadge : styles.closedBadge]}>
              <FontAwesome 
                name="clock-o"
                size={14} 
                color={getCurrentBusinessHours(business) ? "#16A34A" : "#DC2626"} 
              />
              <Text style={[styles.statusValue, getCurrentBusinessHours(business) ? styles.openText : styles.closedText]}>
                {getCurrentBusinessHours(business) ? 'Açık' : 'Kapalı'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton, !getCurrentBusinessHours(business) && styles.buttonDisabled]}
          onPress={() => getCurrentBusinessHours(business) && handleCall(business.phone)}
          disabled={!getCurrentBusinessHours(business)}
        >
          <FontAwesome name="phone" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>
            {getCurrentBusinessHours(business) ? 'Hemen Ara' : 'Şu an Kapalı'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.smsButton,
            !getCurrentBusinessHours(business) && styles.buttonDisabled
          ]}
          onPress={() => getCurrentBusinessHours(business) && handleSMS(business.phone)}
          disabled={!getCurrentBusinessHours(business)}
        >
          <FontAwesome name="commenting" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Hızlı SMS</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, styles.safeArea]} edges={['top']}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#312E81"
      />
      <LinearGradient
        colors={['#312E81', '#4338CA', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.iconGradient}
            >
              <FontAwesome name="car" size={28} color="#fff" style={styles.headerMainIcon} />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, styles.lightText]}>Acil Yol Yardım</Text>
            <Text style={[styles.headerSubtitle, styles.lightText]}>
              Size en yakın yol yardım servisleri {'\n'}7/24 hizmetinizde
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <View style={styles.filterButtonsRow}>
          <TouchableOpacity 
            style={[
              styles.filterActionButton,
              styles.locationActionButton,
              userLocation && styles.locationActionButtonActive
            ]}
            onPress={requestLocationPermission}
          >
            <FontAwesome 
              name={userLocation ? "map-marker" : "location-arrow"} 
              size={20} 
              color={userLocation ? "#4F46E5" : "#64748B"} 
            />
            <Text style={[
              styles.filterActionButtonText,
              userLocation && styles.activeFilterText
            ]}>
              {userLocation ? (
                `${userLocation.region || userLocation.subregion || ''} ${userLocation.city ? `(${userLocation.city})` : ''}`
              ) : 'Konumumu Paylaş'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterActionButton,
              selectedFilters.categories.length > 0 && styles.activeFilterButton
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <FontAwesome 
              name="sliders" 
              size={20} 
              color={selectedFilters.categories.length > 0 ? "#4F46E5" : "#64748B"} 
            />
            <Text style={[
              styles.filterActionButtonText,
              selectedFilters.categories.length > 0 && styles.activeFilterText
            ]}>
              {selectedFilters.categories.length > 0 
                ? `${selectedFilters.categories.length} Kategori Seçili` 
                : 'Filtreleme Yap'}
            </Text>
            {selectedFilters.categories.length > 0 && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  setSelectedFilters(prev => ({ ...prev, categories: [] }));
                  loadServices({
                    city: userLocation?.region || userLocation?.subregion || undefined,
                    district: userLocation?.city || undefined,
                    categories: []
                  });
                }}
              >
                <FontAwesome name="times" size={16} color="#4F46E5" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {services.length > 0 ? (
          <View style={styles.cardsContainer}>
            {services.map(renderServiceCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="exclamation-circle" size={48} color="#999" />
            <Text style={styles.emptyTitle}>Servis Bulunamadı</Text>
            <Text style={styles.emptyText}>
              Şu anda aktif yol yardım servisi bulunmuyor. Lütfen daha sonra tekrar deneyin.
            </Text>
          </View>
        )}
      </ScrollView>

      <FilterModal
        isVisible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        cities={availableCities}
        districts={availableDistricts}
        categories={availableCategories}
        initialCity={userLocation?.region || userLocation?.subregion || undefined}
        initialDistrict={userLocation?.city || undefined}
        isLocationShared={!!userLocation}
        selectedFilters={selectedFilters}
      />

      {selectedBusiness && (
        <BusinessCardDetails
          business={selectedBusiness}
          visible={isDetailsVisible}
          onClose={handleCloseDetails}
        />
      )}
      <FloatingAssistant />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    backgroundColor: '#4F46E5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 0,
    paddingTop: 0,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  closedCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    shadowOpacity: 0.05,
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  openIndicator: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closedIndicator: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  serviceType: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  openBadge: {
    backgroundColor: '#FFFFFF',
    borderColor: '#16A34A',
  },
  closedBadge: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DC2626',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  openText: {
    color: '#16A34A',
  },
  closedText: {
    color: '#DC2626',
  },
  cardBody: {
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationText: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  callButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4338CA',
  },
  smsButton: {
    backgroundColor: '#312E81',
    borderColor: '#312E81',
  },
  buttonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 16,
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerBackground: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 12,
    width: '100%',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMainIcon: {
    opacity: 0.95,
  },
  headerTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  lightText: {
    color: '#FFFFFF',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 12,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  filterActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 52,
  },
  locationActionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  locationActionButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  filterActionButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeFilterButton: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  activeFilterText: {
    color: '#4F46E5',
  },
  clearFilterButton: {
    padding: 6,
    marginLeft: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
});