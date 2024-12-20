import { useEffect, useCallback } from 'react';
import { Platform, InteractionManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

interface CacheResourcesProps {
  images?: number[];
  fonts?: { [key: string]: any };
}

export function usePerformanceOptimizations({ images = [], fonts = {} }: CacheResourcesProps = {}) {
  const colorScheme = useColorScheme();

  const cacheImages = useCallback(async () => {
    return Promise.all(images.map((image) => Asset.fromModule(image).downloadAsync()));
  }, [images]);

  const cacheFonts = useCallback(async () => {
    return Font.loadAsync(fonts);
  }, [fonts]);

  const loadResourcesAsync = useCallback(async () => {
    try {
      await preventAutoHideAsync();
      await Promise.all([cacheImages(), cacheFonts()]);
    } catch (e) {
      console.warn('Error loading resources:', e);
    } finally {
      await hideAsync();
    }
  }, [cacheImages, cacheFonts]);

  const deferredOperations = useCallback(() => {
    if (Platform.OS !== 'web') {
      InteractionManager.runAfterInteractions(() => {
        // Ağır işlemleri burada yapın
        // Örnek: Analytics başlatma, büyük veri setlerini işleme, vs.
      });
    }
  }, []);

  useEffect(() => {
    loadResourcesAsync();
    deferredOperations();
  }, [loadResourcesAsync, deferredOperations]);

  return {
    isDarkMode: colorScheme === 'dark',
  };
} 