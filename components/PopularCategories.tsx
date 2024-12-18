import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type Category = {
  id: string;
  title: string;
  icon: string;
  color: string;
  value: string;
};

const CATEGORIES: Category[] = [
  { id: '1', title: 'Servis', icon: 'wrench', color: '#FF6B6B', value: 'Servisler' },
  { id: '2', title: 'Kaportacı', icon: 'car', color: '#4ECDC4', value: 'Kaportacılar' },
  { id: '3', title: 'Lastik', icon: 'circle', color: '#45B7D1', value: 'Lastikçiler' },
  { id: '4', title: 'Parça', icon: 'cogs', color: '#96CEB4', value: 'Parçacılar' },
  { id: '5', title: 'Motor', icon: 'motorcycle', color: '#D4A5A5', value: 'Motorsikletciler' },
  { id: '6', title: 'Egzoz', icon: 'filter', color: '#FF9F1C', value: 'Egzozcular' },
  { id: '7', title: 'Boyacı', icon: 'paint-brush', color: '#E63946', value: 'Boyacılar' },
  { id: '8', title: 'Ekspertiz', icon: 'search', color: '#2A9D8F', value: 'Ekspertizler' },
  { id: '9', title: 'Fren', icon: 'stop', color: '#E9C46A', value: 'Frenler' },
  { id: '10', title: 'Aksesuar', icon: 'star', color: '#F4A261', value: 'Aksesuarcılar' },
  { id: '11', title: 'Elektrik', icon: 'bolt', color: '#264653', value: 'Elektrikçiler' },
  { id: '12', title: 'Turbo', icon: 'tachometer', color: '#023E8A', value: 'Turbocular' },
  { id: '13', title: 'Yazılım', icon: 'code', color: '#2B9348', value: 'Yazılımcılar' },
  { id: '14', title: 'Cam Film ve Kaplama', icon: 'film', color: '#6A4C93', value: 'Cam Film ve Kaplamacılar' },
  { id: '15', title: 'Kilit', icon: 'lock', color: '#B5838D', value: 'Kilitciler' },
  { id: '16', title: 'Yıkama', icon: 'tint', color: '#457B9D', value: 'Yıkamacılar' },
  { id: '17', title: 'Tuning', icon: 'rocket', color: '#BC6C25', value: 'Tunningciler' },
  { id: '18', title: 'Rot Balans', icon: 'balance-scale', color: '#606C38', value: 'Rot Balanscılar' },
  { id: '19', title: 'Kuaför', icon: 'magic', color: '#9B5DE5', value: 'Oto Kuaförler' },
  { id: '20', title: 'Döşeme', icon: 'car', color: '#F15BB5', value: 'Oto Döşemeciler' },
  { id: '21', title: 'Cam', icon: 'square', color: '#00BBF9', value: 'Camcılar' },
  { id: '22', title: 'Jant', icon: 'circle', color: '#00F5D4', value: 'Jantcılar' },
];

type PopularCategoriesProps = {
  onCategoryPress?: (category: Category) => void;
  onSeeAllPress?: () => void;
  selectedCategory?: string;
};

export default function PopularCategories({ 
  onCategoryPress, 
  onSeeAllPress,
  selectedCategory 
}: PopularCategoriesProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryLayouts = useRef<{ [key: string]: LayoutRectangle }>({});

  const handleCategoryLayout = (categoryId: string) => (event: LayoutChangeEvent) => {
    categoryLayouts.current[categoryId] = event.nativeEvent.layout;
  };

  useEffect(() => {
    if (selectedCategory && scrollViewRef.current) {
      const selectedCategoryData = CATEGORIES.find(cat => cat.value === selectedCategory);
      if (selectedCategoryData) {
        const layout = categoryLayouts.current[selectedCategoryData.id];
        if (layout) {
          scrollViewRef.current.scrollTo({
            x: Math.max(0, layout.x - 20),
            animated: true
          });
        }
      }
    }
  }, [selectedCategory]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.value && styles.selectedCategoryCard
            ]}
            activeOpacity={0.7}
            onPress={() => onCategoryPress?.(category)}
            onLayout={handleCategoryLayout(category.id)}
          >
            <View 
              style={[
                styles.iconContainer, 
                { backgroundColor: selectedCategory === category.value ? '#fff' : category.color }
              ]}
            >
              <FontAwesome 
                name={category.icon} 
                size={24} 
                color={selectedCategory === category.value ? category.color : 'white'} 
              />
            </View>
            <Text 
              style={[
                styles.categoryTitle,
                selectedCategory === category.value && styles.selectedCategoryTitle
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
    borderRadius: 12,
    padding: 8,
  },
  selectedCategoryCard: {
    backgroundColor: '#007AFF',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 12,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryTitle: {
    color: '#fff',
  },
}); 