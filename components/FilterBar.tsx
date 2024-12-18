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
};

const POPULAR_CATEGORIES: FilterOption[] = [
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
  { label: 'Jantcılar', value: 'Jantcılar' },
];

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

  const renderFilterButton = (type: 'city' | 'district' | 'category' | 'brand') => {
    const selected = getSelectedValue(type);
    const icon = getFilterIcon(type);
    const isDisabled = type === 'district' && !selectedCity;

    return (
      <Animated.View>
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
            size={14}
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
      </Animated.View>
    );
  };

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View>
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
      </View>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            { opacity: fadeAnimation }
          ]}
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
              <Text style={styles.modalTitle}>
                Select {activeFilter?.charAt(0).toUpperCase()}
                {activeFilter?.slice(1)}
              </Text>
              <TouchableOpacity
                onPress={handleModalClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === getSelectedValue(activeFilter || 'city');
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.selectedOption]}
                    onPress={() => {
                      if (activeFilter) {
                        onFilterChange(activeFilter, item.value);
                        handleModalClose();
                      }
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {item.label}
                    </Text>
                    {isSelected && <FontAwesome name="check" size={16} color="#007AFF" />}
                  </TouchableOpacity>
                );
              }}
              style={styles.optionsList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

function getCategoryIcon(value: string): string {
  switch (value) {
    case 'Servisler':
      return 'wrench';
    case 'Kaportacılar':
      return 'car';
    case 'Lastikçiler':
      return 'circle-o';
    case 'Parçacılar':
      return 'cogs';
    case 'Motorsikletciler':
      return 'motorcycle';
    case 'Egzozcular':
      return 'filter';
    case 'Boyacılar':
      return 'paint-brush';
    case 'Ekspertizler':
      return 'search';
    case 'Frenciler':
      return 'stop-circle';
    case 'Aksesuarcılar':
      return 'star';
    case 'Elektrikçiler':
      return 'bolt';
    case 'Turbocular':
      return 'dashboard';
    case 'Yazılımcılar':
      return 'code';
    case 'Cam Film ve Kaplamacılar':
      return 'film';
    case 'Kilitciler':
      return 'lock';
    case 'Yıkamacılar':
      return 'tint';
    case 'Tunningciler':
      return 'rocket';
    case 'Rot Balanscılar':
      return 'balance-scale';
    case 'Oto Kuaförler':
      return 'magic';
    case 'Oto Döşemeciler':
      return 'couch';
    case 'Camcılar':
      return 'window-maximize';
    case 'Jantcılar':
      return 'circle';
    default:
      return 'tag';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  container: {
    padding: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 100,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  disabledFilter: {
    backgroundColor: '#F0F0F0',
    opacity: 0.7,
  },
  filterText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 6,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F8F8F8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#F8F8F8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  popularContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  popularItem: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  popularItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  popularItemText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  popularItemTextSelected: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 16,
  },
  allCategoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  popularSection: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: 'white',
  },
  popularSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  popularScrollContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  popularCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  popularCategoryItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  popularCategoryIcon: {
    marginRight: 6,
  },
  popularCategoryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  popularCategoryTextSelected: {
    color: '#fff',
  },
}); 