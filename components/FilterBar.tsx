import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  ScrollView,
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
  const [fadeAnimation] = useState(new Animated.Value(0));

  const getFilterOptions = () => {
    switch (activeFilter) {
      case 'city':
        return cities;
      case 'district':
        return districts;
      case 'category':
        return categories;
      case 'brand':
        return brands;
      default:
        return [];
    }
  };

  const filteredOptions = useMemo(() => {
    const options = getFilterOptions();
    if (!searchQuery.trim()) return options;
    
    return options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeFilter, searchQuery]);

  const getSelectedValue = (type: 'city' | 'district' | 'category' | 'brand') => {
    switch (type) {
      case 'city':
        return selectedCity;
      case 'district':
        return selectedDistrict;
      case 'category':
        return selectedCategory;
      case 'brand':
        return selectedBrand;
      default:
        return '';
    }
  };

  const getFilterTitle = (type: 'city' | 'district' | 'category' | 'brand') => {
    switch (type) {
      case 'city':
        return 'Şehir Seçin';
      case 'district':
        return selectedCity ? `${selectedCity} İlçeleri` : 'İlçe Seçin';
      case 'category':
        return 'Kategori Seçin';
      case 'brand':
        return 'Marka Seçin';
      default:
        return '';
    }
  };

  const getFilterIcon = (type: 'city' | 'district' | 'category' | 'brand') => {
    switch (type) {
      case 'city':
        return 'building';
      case 'district':
        return 'map-marker';
      case 'category':
        return 'tags';
      case 'brand':
        return 'car';
      default:
        return 'tag';
    }
  };

  const animateModal = (show: boolean) => {
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
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

  const renderFilterButton = (type: 'city' | 'district' | 'category' | 'brand') => {
    const selected = getSelectedValue(type);
    const icon = getFilterIcon(type);
    const isDisabled = type === 'district' && !selectedCity;

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          selected ? styles.activeFilter : null,
          isDisabled ? styles.disabledFilter : null,
        ]}
        onPress={() => {
          if (isDisabled) return;
          handleModalOpen(type);
        }}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <FontAwesome
          name={icon}
          size={16}
          color={selected ? '#fff' : isDisabled ? '#999' : '#666'}
        />
        <Text
          style={[
            styles.filterText,
            selected ? styles.activeFilterText : null,
            isDisabled ? styles.disabledFilterText : null,
          ]}
          numberOfLines={1}
        >
          {selected || (type === 'city' ? 'Şehir' : type === 'district' ? 'İlçe' : type === 'category' ? 'Kategori' : 'Marka')}
        </Text>
        <FontAwesome
          name="chevron-down"
          size={12}
          color={selected ? '#fff' : isDisabled ? '#999' : '#666'}
          style={styles.chevron}
        />
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

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {renderFilterButton('city')}
          {renderFilterButton('district')}
          {renderFilterButton('category')}
          {renderFilterButton('brand')}
        </ScrollView>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearFilters}
            activeOpacity={0.7}
          >
            <FontAwesome name="times" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnimation }
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={handleModalClose}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
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
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  disabledFilter: {
    opacity: 0.5,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  activeFilterText: {
    color: '#fff',
  },
  disabledFilterText: {
    color: '#999',
  },
  chevron: {
    marginLeft: 2,
  },
  clearButton: {
    padding: 8,
    marginRight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: SCREEN_WIDTH * 1.1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  closeButton: {
    padding: 8,
    width: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
}); 