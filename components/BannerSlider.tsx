import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
  ViewabilityConfig,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

type Banner = {
  id: string;
  image: string;
  title: string;
};

const BANNERS: Banner[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    title: 'Yeni Yıl İndirimleri',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
    title: 'Özel Fırsatlar',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    title: 'Kampanyalar',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
    title: 'Yeni Ürünler',
  },
];

export default function BannerSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (activeSlide + 1) % BANNERS.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setActiveSlide(nextIndex);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [activeSlide]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index || 0);
    }
  }).current;

  const renderItem = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      style={styles.slide}
      activeOpacity={0.9}
      onPress={() => console.log('Banner pressed:', item.id)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      <View style={styles.pagination}>
        {BANNERS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeSlide && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  slide: {
    width: screenWidth,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagination: {
    position: 'absolute',
    bottom: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
  },
}); 