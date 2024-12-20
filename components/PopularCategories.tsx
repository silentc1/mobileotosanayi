import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Category = {
  id: string;
  title: string;
  icon: string;
  color: string;
  gradient: string[];
  value: string;
};

const CATEGORIES: Category[] = [
  { 
    id: '1', 
    title: 'Servis', 
    icon: 'wrench', 
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FF8E8E'],
    value: 'Servisler' 
  },
  { 
    id: '2', 
    title: 'Kaportacı', 
    icon: 'car', 
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#6EE7E0'],
    value: 'Kaportacılar' 
  },
  { 
    id: '3', 
    title: 'Lastik', 
    icon: 'circle', 
    color: '#45B7D1',
    gradient: ['#45B7D1', '#65D7F1'],
    value: 'Lastikçiler' 
  },
  { 
    id: '4', 
    title: 'Parça', 
    icon: 'cogs', 
    color: '#96CEB4',
    gradient: ['#96CEB4', '#B6EED4'],
    value: 'Parçacılar' 
  },
  { 
    id: '5', 
    title: 'Motor', 
    icon: 'motorcycle', 
    color: '#D4A5A5',
    gradient: ['#D4A5A5', '#F4C5C5'],
    value: 'Motorsikletciler' 
  },
  { 
    id: '6', 
    title: 'Egzoz', 
    icon: 'filter', 
    color: '#FF9F1C',
    gradient: ['#FF9F1C', '#FFBF3C'],
    value: 'Egzozcular' 
  },
  { 
    id: '7', 
    title: 'Boyacı', 
    icon: 'paint-brush', 
    color: '#E63946',
    gradient: ['#E63946', '#FF5966'],
    value: 'Boyacılar' 
  },
  { 
    id: '8', 
    title: 'Ekspertiz', 
    icon: 'search', 
    color: '#2A9D8F',
    gradient: ['#2A9D8F', '#4ABDAF'],
    value: 'Ekspertizler' 
  },
  { id: '9', title: 'Fren', icon: 'stop', color: '#E9C46A', gradient: ['#E9C46A', '#FFD799'], value: 'Frenler' },
  { id: '10', title: 'Aksesuar', icon: 'star', color: '#F4A261', gradient: ['#F4A261', '#FFC799'], value: 'Aksesuarcılar' },
  { id: '11', title: 'Elektrik', icon: 'bolt', color: '#264653', gradient: ['#264653', '#466975'], value: 'Elektrikçiler' },
  { id: '12', title: 'Turbo', icon: 'tachometer', color: '#023E8A', gradient: ['#023E8A', '#2357A6'], value: 'Turbocular' },
  { id: '13', title: 'Yazılım', icon: 'code', color: '#2B9348', gradient: ['#2B9348', '#4BAF65'], value: 'Yazılımcılar' },
  { id: '14', title: 'Kaplama', icon: 'film', color: '#6A4C93', gradient: ['#6A4C93', '#8A6FB3'], value: 'Cam Film ve Kaplamacılar' },
  { id: '15', title: 'Kilit', icon: 'lock', color: '#B5838D', gradient: ['#B5838D', '#D5A3AD'], value: 'Kilitciler' },
  { id: '16', title: 'Yıkama', icon: 'tint', color: '#457B9D', gradient: ['#457B9D', '#659DBD'], value: 'Yıkamacılar' },
  { id: '17', title: 'Tuning', icon: 'rocket', color: '#BC6C25', gradient: ['#BC6C25', '#DC9C55'], value: 'Tunningciler' },
  { id: '18', title: 'Rot Balans', icon: 'balance-scale', color: '#606C38', gradient: ['#606C38', '#808C58'], value: 'Rot Balanscılar' },
  { id: '19', title: 'Kuaför', icon: 'magic', color: '#9B5DE5', gradient: ['#9B5DE5', '#BB8ED5'], value: 'Oto Kuaförler' },
  { id: '20', title: 'Döşeme', icon: 'car', color: '#F15BB5', gradient: ['#F15BB5', '#FF7FB5'], value: 'Oto Döşemeciler' },
  { id: '21', title: 'Cam', icon: 'square', color: '#00BBF9', gradient: ['#00BBF9', '#40D7FF'], value: 'Camcılar' },
  { id: '22', title: 'Jant', icon: 'circle', color: '#00F5D4', gradient: ['#00F5D4', '#40FFE0'], value: 'Jantcılar' },
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
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.value;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && styles.selectedCategoryCard
              ]}
              activeOpacity={0.7}
              onPress={() => onCategoryPress?.(category)}
              onLayout={handleCategoryLayout(category.id)}
            >
              <LinearGradient
                colors={isSelected ? ['#007AFF', '#409CFF'] : category.gradient}
                style={styles.gradientContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome 
                    name={category.icon} 
                    size={24} 
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.categoryTitle}>
                  {category.title}
                </Text>
                <View style={styles.arrow}>
                  <FontAwesome 
                    name="chevron-right" 
                    size={12} 
                    color="#FFFFFF" 
                    style={{ opacity: 0.8 }}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  categoryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.02 }],
  },
  gradientContainer: {
    width: 80,
    height: 100,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  arrow: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}); 