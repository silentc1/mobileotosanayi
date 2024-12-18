import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type Category = {
  id: string;
  title: string;
  icon: string;
  color: string;
};

const CATEGORIES: Category[] = [
  { id: '1', title: 'Servisler', icon: 'wrench', color: '#FF6B6B' },
  { id: '2', title: 'Kaportacılar', icon: 'car', color: '#4ECDC4' },
  { id: '3', title: 'Lastikçiler', icon: 'circle', color: '#45B7D1' },
  { id: '4', title: 'Parçacılar', icon: 'cogs', color: '#96CEB4' },
  { id: '5', title: 'Motorsikletciler', icon: 'motorcycle', color: '#D4A5A5' },
  { id: '6', title: 'Egzozcular', icon: 'filter', color: '#FF9F1C' },
  { id: '7', title: 'Boyacılar', icon: 'paint-brush', color: '#E63946' },
  { id: '8', title: 'Ekspertizler', icon: 'search', color: '#2A9D8F' },
  { id: '9', title: 'Frenciler', icon: 'stop', color: '#E9C46A' },
  { id: '10', title: 'Aksesuarcılar', icon: 'star', color: '#F4A261' },
  { id: '11', title: 'Elektrikçiler', icon: 'bolt', color: '#264653' },
  { id: '12', title: 'Turbocular', icon: 'tachometer', color: '#023E8A' },
  { id: '13', title: 'Yazılımcılar', icon: 'code', color: '#2B9348' },
  { id: '14', title: 'Cam Film ve Kaplamacılar', icon: 'film', color: '#6A4C93' },
  { id: '15', title: 'Kilitciler', icon: 'lock', color: '#B5838D' },
  { id: '16', title: 'Yıkamacılar', icon: 'tint', color: '#457B9D' },
  { id: '17', title: 'Tunningciler', icon: 'rocket', color: '#BC6C25' },
  { id: '18', title: 'Rot Balanscılar', icon: 'balance-scale', color: '#606C38' },
  { id: '19', title: 'Oto Kuaförler', icon: 'magic', color: '#9B5DE5' },
  { id: '20', title: 'Oto Döşemeciler', icon: 'car', color: '#F15BB5' },
  { id: '21', title: 'Camcılar', icon: 'square', color: '#00BBF9' },
  { id: '22', title: 'Jantcılar', icon: 'circle', color: '#00F5D4' },
];

type PopularCategoriesProps = {
  onCategoryPress?: (category: Category) => void;
  onSeeAllPress?: () => void;
};

export default function PopularCategories({ onCategoryPress, onSeeAllPress }: PopularCategoriesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kategoriler</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            activeOpacity={0.7}
            onPress={() => onCategoryPress?.(category)}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
              <FontAwesome name={category.icon} size={24} color="white" />
            </View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingRight: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
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
}); 