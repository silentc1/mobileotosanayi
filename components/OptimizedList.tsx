import { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  ViewToken,
  ViewabilityConfig,
  ListRenderItem,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';

interface OptimizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  numColumns?: number;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
}

const DEFAULT_VIEWABILITY_CONFIG: ViewabilityConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 20,
  waitForInteraction: true,
};

function OptimizedListComponent<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onRefresh,
  isLoading,
  isRefreshing,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
  style,
  horizontal,
  numColumns,
  onViewableItemsChanged,
  initialNumToRender = 10,
  maxToRenderPerBatch = 5,
  windowSize = 5,
  removeClippedSubviews = true,
}: OptimizedListProps<T>) {
  const memoizedData = useMemo(() => data, [data]);

  const memoizedRenderItem = useCallback(
    (props: any) => renderItem(props),
    [renderItem]
  );

  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 100, // Adjust this value based on your item height
      offset: 100 * index,
      index,
    }),
    []
  );

  const ListFooter = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" />
        </View>
      );
    }
    return ListFooterComponent;
  }, [isLoading, ListFooterComponent]);

  return (
    <FlatList
      data={memoizedData}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooter}
      contentContainerStyle={contentContainerStyle}
      style={style}
      horizontal={horizontal}
      numColumns={numColumns}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={DEFAULT_VIEWABILITY_CONFIG}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const OptimizedList = memo(OptimizedListComponent) as typeof OptimizedListComponent;
export type { OptimizedListProps }; 