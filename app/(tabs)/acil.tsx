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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import FilterModal from '../components/FilterModal';

const { width } = Dimensions.get('window');

type AcilService = {
  _id: string;
  acilType: string;
  acilSehir: string;
  acilIlce: string;
  acilNo: string;
  isOpen: boolean;
  editor: boolean;
  yaklasik: string;
};

export default function AcilScreen() {
  const [services, setServices] = useState<AcilService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationGeocodedAddress | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  const loadServices = async (filters?: { city?: string; district?: string; category?: string }) => {
    try {
      setIsLoading(true);
      console.log('Filtreler:', filters);
      
      let formattedCity = filters?.city;
      if (formattedCity) {
        formattedCity = normalizeCity(formattedCity);
      }

      console.log('Formatlanmış şehir:', formattedCity);
      
      const response = await apiService.getAcilServices({
        sehir: formattedCity,
        ilce: filters?.district,
        kategori: filters?.category,
      });
      console.log('Bulunan servisler:', response.services.length);
      setServices(response.services);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

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

        const cityName = geocode[0].region || geocode[0].subregion || geocode[0].city;
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
    // Türkçe karakterleri ASCII karşılıklarına dönüştür
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
      // İlk harfi büyük, diğerleri küçük
      .toLowerCase()
      .replace(/^[a-z]/, letter => letter.toUpperCase());
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await apiService.getAcilServices({});
        if (response.filters) {
          setAvailableCities(response.filters.sehirler || []);
          setAvailableDistricts(response.filters.ilceler || []);
        }
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (userLocation?.region) {
      loadServices({ city: userLocation.region });
    } else if (userLocation?.subregion) {
      loadServices({ city: userLocation.subregion });
    } else {
      loadServices();
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderServiceCard = (service: AcilService) => (
    <TouchableOpacity 
      key={service._id} 
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => handleCall(service.acilNo)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.serviceTypeContainer}>
          <View style={[styles.statusIndicator, service.isOpen ? styles.openIndicator : styles.closedIndicator]} />
          <Text style={styles.serviceType}>{service.acilType}</Text>
        </View>
        {service.editor && (
          <View style={styles.verifiedBadge}>
            <FontAwesome name="check-circle" size={12} color="#4F46E5" />
            <Text style={styles.verifiedText}>Onaylı</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={16} color="#666" />
          <Text style={styles.locationText}>{service.acilIlce}, {service.acilSehir}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Yaklaşık Ücret</Text>
            <Text style={styles.priceValue}>{service.yaklasik} ₺</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Durum</Text>
            <Text style={[styles.statusValue, service.isOpen ? styles.openText : styles.closedText]}>
              {service.isOpen ? 'Açık' : 'Kapalı'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.callButton, !service.isOpen && styles.callButtonDisabled]}
        onPress={() => service.isOpen && handleCall(service.acilNo)}
        disabled={!service.isOpen}
      >
        <FontAwesome name="phone" size={18} color="#fff" style={styles.callIcon} />
        <Text style={styles.callButtonText}>
          {service.isOpen ? 'Hemen Ara' : 'Şu an Kapalı'}
        </Text>
      </TouchableOpacity>
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>7/24 Acil Yol Yardım</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={requestLocationPermission}
        >
          <FontAwesome 
            name={userLocation ? "map-marker" : "location-arrow"} 
            size={16} 
            color="#4F46E5" 
          />
          <Text style={styles.locationButtonText}>
            {userLocation ? (
              `${userLocation.region || userLocation.subregion || ''} ${userLocation.city ? `(${userLocation.city})` : ''}`
            ) : 'Konumumu Paylaş'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <FontAwesome name="filter" size={16} color="#4F46E5" />
          <Text style={styles.filterButtonText}>Filtreleme Yap</Text>
        </TouchableOpacity>
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
        onApply={(filters) => {
          loadServices(filters);
          setShowFilterModal(false);
        }}
        cities={availableCities}
        districts={availableDistricts}
        categories={['Lastikci', 'Çekici', 'Akücü', 'Yakıt']}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    backgroundColor: '#fff',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  openIndicator: {
    backgroundColor: '#10B981',
  },
  closedIndicator: {
    backgroundColor: '#EF4444',
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  cardBody: {
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  openText: {
    color: '#10B981',
  },
  closedText: {
    color: '#EF4444',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  callButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  callIcon: {
    marginRight: 4,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  header: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    minHeight: 48,
  },
  locationButtonText: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  filterButtonText: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '500',
  },
});