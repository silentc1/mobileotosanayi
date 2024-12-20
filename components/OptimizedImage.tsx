import { memo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, StyleProp, ViewStyle, ImageStyle } from 'react-native';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

interface OptimizedImageProps {
  source: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
}

const OptimizedImage = memo(({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
  transition = 200,
  priority = 'normal'
}: OptimizedImageProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        style={[styles.image, style]}
        source={source}
        contentFit={contentFit}
        transition={transition}
        placeholder={blurhash}
        priority={priority}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default OptimizedImage; 