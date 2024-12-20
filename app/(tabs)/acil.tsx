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
  editor: boolean;
  yaklasik: string;
};

type SortOption = 'price_asc' | 'price_desc' | 'editor' | 'none';

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
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const [showSortPicker, setShowSortPicker] = useState(false);

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
              <Text style={styles.pickerTitle}>
                {showPicker === 'sehir' ? 'Şehir Seçin' : showPicker === 'ilce' ? 'İlçe Seçin' : 'Kategori Seçin'}
              </Text>
              <View style={{ width: 50 }} />
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedValue}
                onValueChange={onValueChange}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item 
                  label={`Tüm ${showPicker === 'sehir' ? 'Şehirler' : showPicker === 'ilce' ? 'İlçeler' : 'Kategoriler'}`} 
                  value="" 
                />
                {items.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const sortServices = (services: AcilService[]): AcilService[] => {
    const sortedServices = [...services];
    
    switch (sortOption) {
      case 'price_asc':
        return sortedServices.sort((a, b) => 
          parseInt(a.yaklasik) - parseInt(b.yaklasik)
        );
      case 'price_desc':
        return sortedServices.sort((a, b) => 
          parseInt(b.yaklasik) - parseInt(a.yaklasik)
        );
      case 'editor':
        return sortedServices.sort((a, b) => 
          (b.editor ? 1 : 0) - (a.editor ? 1 : 0)
        );
      default:
        return sortedServices;
    }
  };

  const renderSortPicker = () => {
    if (!showSortPicker) return null;

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
                onPress={() => setShowSortPicker(false)}
                style={styles.pickerCloseButton}
              >
                <Text style={styles.pickerCloseButtonText}>Kapat</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Sıralama</Text>
              <View style={{ width: 50 }} />
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sortOption}
                onValueChange={(value) => {
                  setSortOption(value as SortOption);
                  setShowSortPicker(false);
                }}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Varsayılan Sıralama" value="none" />
                <Picker.Item label="Fiyat (Düşükten Yükseğe)" value="price_asc" />
                <Picker.Item label="Fiyat (Yüksekten Düşüğe)" value="price_desc" />
                <Picker.Item label="Editörün Seçtikleri" value="editor" />
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterItem}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterLabel}>Filtrele</Text>
          {(selectedFilters.sehir || selectedFilters.ilce || selectedFilters.kategori || sortOption !== 'none') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedFilters({
                  sehir: '',
                  ilce: '',
                  kategori: '',
                });
                setSortOption('none');
              }}
            >
              <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterButtons}>
          {renderPickerButton('Şehir', selectedFilters.sehir, 'sehir')}
          {renderPickerButton('İlçe', selectedFilters.ilce, 'ilce')}
          {renderPickerButton('Kategori', selectedFilters.kategori, 'kategori')}
          <TouchableOpacity
            style={[styles.pickerButton, styles.sortButton]}
            onPress={() => setShowSortPicker(true)}
          >
            <FontAwesome name="sort" size={14} color="#666" />
            <Text style={styles.pickerButtonValue}>
              {sortOption === 'price_asc' ? 'Fiyat ↑' :
               sortOption === 'price_desc' ? 'Fiyat ↓' :
               sortOption === 'editor' ? 'Editör Seçimi' :
               'Sıralama'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderServiceCard = (service: AcilService) => (
    <TouchableOpacity 
      key={service._id} 
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => handleCall(service.acilNo)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <View style={styles.typeContainer}>
              <FontAwesome name="wrench" size={16} color="#007AFF" style={styles.typeIcon} />
              <Text style={styles.serviceType}>{service.acilType}</Text>
            </View>
            <View style={styles.locationContainer}>
              <FontAwesome name="map-marker" size={14} color="#666" style={styles.locationIcon} />
              <Text style={styles.location}>
                {service.acilIlce}, {service.acilSehir}
              </Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, service.isOpen ? styles.openBadge : styles.closedBadge]}>
              <FontAwesome 
                name={service.isOpen ? "check-circle" : "times-circle"} 
                size={12} 
                color={service.isOpen ? "#34A853" : "#EA4335"} 
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, service.isOpen ? styles.openText : styles.closedText]}>
                {service.isOpen ? 'Açık' : 'Kapalı'}
              </Text>
            </View>
            {service.editor && (
              <View style={styles.editorBadge}>
                <FontAwesome name="star" size={12} color="#1a1a1a" style={styles.editorIcon} />
                <Text style={styles.editorText}>Uygulama Güvencesi</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <FontAwesome name="tag" size={14} color="#666" style={styles.priceIcon} />
            <View>
              <Text style={styles.priceLabel}>Yaklaşık Ücret:</Text>
              <Text style={styles.priceValue}>{service.yaklasik} ₺</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(service.acilNo)}
          >
            <FontAwesome name="phone" size={18} color="#fff" style={styles.callIcon} />
            <Text style={styles.callButtonText}>Hemen Ara</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>7/24 Acil Yol Yardım</Text>
        <Text style={styles.headerSubtitle}>Size en yakın yol yardım hizmetleri</Text>
      </View>

      {renderFilters()}
      {renderPicker()}
      {renderSortPicker()}

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
            {sortServices(services).map(renderServiceCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={48} color="#999" />
            <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptyText}>
              Seçili kriterlere uygun acil servis bulunamadı. Lütfen filtreleri değiştirerek tekrar deneyin.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerButtonLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pickerButtonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    marginRight: 8,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 6,
  },
  location: {
    fontSize: 14,
    color: '#666666',
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  openBadge: {
    backgroundColor: '#E6F4EA',
  },
  closedBadge: {
    backgroundColor: '#FCE8E8',
  },
  statusIcon: {
    marginRight: 4,
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
  editorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3D6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editorIcon: {
    marginRight: 4,
  },
  editorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  callIcon: {
    marginRight: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    lineHeight: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  pickerItem: {
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
}); 