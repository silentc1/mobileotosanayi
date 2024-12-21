import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type FilterModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onApply: (filters: { city?: string; district?: string; category?: string }) => void;
  cities: string[];
  districts: string[];
  categories: string[];
  initialCity?: string;
  initialDistrict?: string;
  isLocationShared?: boolean;
};

export default function FilterModal({
  isVisible,
  onClose,
  onApply,
  cities,
  districts,
  categories,
  initialCity,
  initialDistrict,
  isLocationShared = false,
}: FilterModalProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [citySearch, setCitySearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    if (initialCity) setSelectedCity(initialCity);
    if (initialDistrict) setSelectedDistrict(initialDistrict);
  }, [initialCity, initialDistrict]);

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredDistricts = districts.filter(district =>
    district.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleApply = () => {
    onApply({
      city: selectedCity,
      district: selectedDistrict,
      category: selectedCategory
    });
    onClose();
  };

  const handleClear = () => {
    if (!isLocationShared) {
      setSelectedCity('');
      setSelectedDistrict('');
    }
    setSelectedCategory('');
    setCitySearch('');
    setDistrictSearch('');
    setCategorySearch('');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome name="times" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtreleme</Text>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Şehir ve İlçe seçimi sadece konum paylaşılmamışsa gösterilir */}
            {!isLocationShared && (
              <>
                {/* Şehir Seçimi */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Şehir Seçin</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Şehir ara..."
                    value={citySearch}
                    onChangeText={setCitySearch}
                    placeholderTextColor="#999"
                  />
                  <ScrollView style={styles.optionsList} nestedScrollEnabled>
                    {filteredCities.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.optionItem,
                          selectedCity === city && styles.selectedOption
                        ]}
                        onPress={() => {
                          setSelectedCity(city);
                          setSelectedDistrict('');
                        }}
                      >
                        <Text style={[
                          styles.optionText,
                          selectedCity === city && styles.selectedOptionText
                        ]}>
                          {city}
                        </Text>
                        {selectedCity === city && (
                          <FontAwesome name="check" size={16} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* İlçe Seçimi */}
                {selectedCity && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>İlçe Seçin</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="İlçe ara..."
                      value={districtSearch}
                      onChangeText={setDistrictSearch}
                      placeholderTextColor="#999"
                    />
                    <ScrollView style={styles.optionsList} nestedScrollEnabled>
                      {filteredDistricts.map((district) => (
                        <TouchableOpacity
                          key={district}
                          style={[
                            styles.optionItem,
                            selectedDistrict === district && styles.selectedOption
                          ]}
                          onPress={() => setSelectedDistrict(district)}
                        >
                          <Text style={[
                            styles.optionText,
                            selectedDistrict === district && styles.selectedOptionText
                          ]}>
                            {district}
                          </Text>
                          {selectedDistrict === district && (
                            <FontAwesome name="check" size={16} color="#4F46E5" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {/* Kategori Seçimi */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kategori Seçin</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Kategori ara..."
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholderTextColor="#999"
              />
              <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.optionItem,
                      selectedCategory === category && styles.selectedOption
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedCategory === category && styles.selectedOptionText
                    ]}>
                      {category}
                    </Text>
                    {selectedCategory === category && (
                      <FontAwesome name="check" size={16} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.applyButton,
              (!selectedCategory && (!selectedCity || isLocationShared)) && styles.applyButtonDisabled
            ]}
            onPress={handleApply}
            disabled={!selectedCategory && (!selectedCity || isLocationShared)}
          >
            <Text style={styles.applyButtonText}>
              Uygula
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  closeButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  selectedOption: {
    backgroundColor: '#F5F3FF',
  },
  optionText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  selectedOptionText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 