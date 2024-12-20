import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
  Animated,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type FilterOption = {
  label: string;
  value: string;
};

type FilterBarProps = {
  cities: FilterOption[];
  districts: FilterOption[];
  categories: FilterOption[];
  brands: FilterOption[];
  selectedCity: string;
  selectedDistrict: string;
  selectedCategory: string;
  selectedBrand: string;
  onFilterChange: (filterType: 'city' | 'district' | 'category' | 'brand', value: string) => void;
  onClearFilters: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FilterBar({
  cities,
  districts,
  categories,
  brands,
  selectedCity,
  selectedDistrict,
  selectedCategory,
  selectedBrand,
  onFilterChange,
  onClearFilters,
}: FilterBarProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'city' | 'district' | 'category' | 'brand' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalAnimation] = useState(new Animated.Value(0));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const getFilterOptions = () => {
    switch (activeFilter) {
      case 'city': return cities;
      case 'district': return districts;
      case 'category': return categories;
      case 'brand': return brands;
      default: return [];
    }
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ıİiI]/g, 'i')
      .replace(/[şŞ]/g, 's')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c');
  };

  const filteredOptions = useMemo(() => {
    const options = getFilterOptions();
    if (!searchQuery.trim()) return options;
    
    const normalizedSearch = normalizeText(searchQuery);
    return options.filter(option => {
      const normalizedLabel = normalizeText(option.label);
      const normalizedValue = normalizeText(option.value);
      return normalizedLabel.includes(normalizedSearch) || normalizedValue.includes(normalizedSearch);
    });
  }, [activeFilter, searchQuery, getFilterOptions]);

  const getSelectedValue = (type: 'city' | 'district' | 'category' | 'brand') => {
    switch (type) {
      case 'city': return selectedCity;
      case 'district': return selectedDistrict;
      case 'category': return selectedCategory;
      case 'brand': return selectedBrand;
      default: return '';
    }
  };

  const getFilterTitle = (type: 'city' | 'district' | 'category' | 'brand') => {
    switch (type) {
      case 'city': return 'Şehir Seçin';
      case 'district': return selectedCity ? `${selectedCity} İlçeleri` : 'İlçe Seçin';
      case 'category': return 'Kategori Seçin';
      case 'brand': return 'Marka Seçin';
      default: return '';
    }
  };

  const getFilterIcon = (type: 'city' | 'district' | 'category' | 'brand') => {
    switch (type) {
      case 'city': return 'building';
      case 'district': return 'map-marker';
      case 'category': return 'tags';
      case 'brand': return 'car';
      default: return 'tag';
    }
  };

  const animateModal = (show: boolean) => {
    Animated.timing(modalAnimation, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (!show) {
        setSearchQuery('');
      }
    });
  };

  const handleModalOpen = (type: 'city' | 'district' | 'category' | 'brand') => {
    setActiveFilter(type);
    setModalVisible(true);
    animateModal(true);
  };

  const handleModalClose = () => {
    Keyboard.dismiss();
    animateModal(false);
    setTimeout(() => {
      setModalVisible(false);
      setActiveFilter(null);
    }, 300);
  };

  const handleOptionSelect = (value: string) => {
    if (!activeFilter) return;
    onFilterChange(activeFilter, value);
    handleModalClose();
  };

  const hasActiveFilters = selectedCity || selectedDistrict || selectedCategory || selectedBrand;

  const renderFilterChip = (type: 'city' | 'district' | 'category' | 'brand') => {
    const selected = getSelectedValue(type);
    const icon = getFilterIcon(type);
    const isDisabled = type === 'district' && !selectedCity;
    const label = selected || (
      type === 'city' ? 'Şehir' :
      type === 'district' ? 'İlçe' :
      type === 'category' ? 'Kategori' :
      'Marka'
    );

    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          selected && styles.activeChip,
          isDisabled && styles.disabledChip,
        ]}
        onPress={() => {
          if (!isDisabled) handleModalOpen(type);
        }}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <FontAwesome
          name={icon}
          size={14}
          color={selected ? '#FFFFFF' : isDisabled ? '#999' : '#666'}
        />
        <Text
          style={[
            styles.chipText,
            selected && styles.activeChipText,
            isDisabled && styles.disabledChipText,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFilterOption = ({ item }: { item: FilterOption }) => {
    const isSelected = activeFilter ? getSelectedValue(activeFilter) === item.value : false;

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption,
        ]}
        onPress={() => handleOptionSelect(item.value)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.optionText,
          isSelected && styles.selectedOptionText,
        ]}>
          {item.label}
        </Text>
        {isSelected && (
          <FontAwesome name="check" size={16} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.chipContainer}>
          {renderFilterChip('city')}
          {renderFilterChip('district')}
          {renderFilterChip('category')}
          {renderFilterChip('brand')}
          
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClearFilters}
              activeOpacity={0.7}
            >
              <FontAwesome name="times" size={14} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { marginBottom: keyboardHeight }
          ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleModalClose}
              >
                <FontAwesome name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {activeFilter ? getFilterTitle(activeFilter) : ''}
              </Text>
              <View style={styles.closeButton} />
            </View>

            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ara..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredOptions}
              renderItem={renderFilterOption}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  content: {
    paddingHorizontal: 45,
    paddingVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeChip: {
    backgroundColor: '#007AFF',
  },
  disabledChip: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  disabledChipText: {
    color: '#999',
  },
  clearButton: {
    width: 16,
    height: 16,
    borderRadius: 16,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 16,
    color: '#1A1A1A',
  },
  optionsList: {
    padding: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectedOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
}); 