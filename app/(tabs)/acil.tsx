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
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type AcilService = {
  _id: string;
  acilType: string;
  acilSehir: string;
  acilIlce: string;
  acilNo: string;
  isOpen: boolean;
};

export default function AcilScreen() {
  const [services, setServices] = useState<AcilService[]>([]);
  const [filters, setFilters] = useState<{
    sehirler: string[];
    ilceler: string[];
    kategoriler: string[];
  }>({
    sehirler: [],
    ilceler: [],
    kategoriler: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    sehir: '',
    ilce: '',
    kategori: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState<'sehir' | 'ilce' | 'kategori' | null>(null);

  const loadServices = async () => {
    try {
      const response = await apiService.getAcilServices(selectedFilters);
      setServices(response.services);
      setFilters(response.filters);
    } catch (error) {
      console.error('Error loading acil services:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedFilters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadServices();
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderPickerButton = (
    label: string,
    value: string,
    type: 'sehir' | 'ilce' | 'kategori'
  ) => (
    <TouchableOpacity
      style={styles.pickerButton}
      onPress={() => setShowPicker(type)}
    >
      <Text style={styles.pickerButtonLabel}>{label}</Text>
      <Text style={styles.pickerButtonValue}>
        {value || `Tüm ${label}`}
      </Text>
      <FontAwesome name="chevron-down" size={12} color="#666" />
    </TouchableOpacity>
  );

  const renderPicker = () => {
    if (!showPicker) return null;

    let items: string[] = [];
    let selectedValue = '';
    let onValueChange = (value: string) => {};

    switch (showPicker) {
      case 'sehir':
        items = filters.sehirler;
        selectedValue = selectedFilters.sehir;
        onValueChange = (value) => {
          setSelectedFilters({ ...selectedFilters, sehir: value, ilce: '' });
          setShowPicker(null);
        };
        break;
      case 'ilce':
        items = filters.ilceler.filter(
          (ilce) => !selectedFilters.sehir || 
          services.some(s => s.acilSehir === selectedFilters.sehir && s.acilIlce === ilce)
        );
        selectedValue = selectedFilters.ilce;
        onValueChange = (value) => {
          setSelectedFilters({ ...selectedFilters, ilce: value });
          setShowPicker(null);
        };
        break;
      case 'kategori':
        items = filters.kategoriler;
        selectedValue = selectedFilters.kategori;
        onValueChange = (value) => {
          setSelectedFilters({ ...selectedFilters, kategori: value });
          setShowPicker(null);
        };
        break;
    }

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                onPress={() => setShowPicker(null)}
                style={styles.pickerCloseButton}
              >
                <Text style={styles.pickerCloseButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedValue}
              onValueChange={onValueChange}
              style={styles.picker}
            >
              <Picker.Item label={`Tüm ${showPicker === 'sehir' ? 'Şehirler' : showPicker === 'ilce' ? 'İlçeler' : 'Kategoriler'}`} value="" />
              {items.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>Filtrele</Text>
        <View style={styles.filterButtons}>
          {renderPickerButton('Şehir', selectedFilters.sehir, 'sehir')}
          {renderPickerButton('İlçe', selectedFilters.ilce, 'ilce')}
          {renderPickerButton('Kategori', selectedFilters.kategori, 'kategori')}
        </View>
      </View>
    </View>
  );

  const renderServiceCard = (service: AcilService) => (
    <View key={service._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.serviceType}>{service.acilType}</Text>
          <Text style={styles.location}>
            {service.acilIlce}, {service.acilSehir}
          </Text>
        </View>
        <View style={[styles.statusBadge, service.isOpen ? styles.openBadge : styles.closedBadge]}>
          <Text style={[styles.statusText, service.isOpen ? styles.openText : styles.closedText]}>
            {service.isOpen ? 'Açık' : 'Kapalı'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.callButton}
        onPress={() => handleCall(service.acilNo)}
      >
        <FontAwesome name="phone" size={20} color="#fff" />
        <Text style={styles.callButtonText}>Ara</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderFilters()}
      {renderPicker()}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.cardsContainer}>
          {services.length > 0 ? (
            services.map(renderServiceCard)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome name="info-circle" size={48} color="#999" />
              <Text style={styles.emptyText}>
                Seçili kriterlere uygun acil servis bulunamadı
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    gap: 8,
  },
  pickerButtonLabel: {
    fontSize: 14,
    color: '#666',
  },
  pickerButtonValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  pickerCloseButton: {
    padding: 8,
  },
  pickerCloseButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  picker: {
    height: 216,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: '#e6f4ea',
  },
  closedBadge: {
    backgroundColor: '#fce8e8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openText: {
    color: '#34A853',
  },
  closedText: {
    color: '#EA4335',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
}); 