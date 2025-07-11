import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../ProductCard';
import { ProductSkeleton } from '../SkeletonComponents';

const { width: screenWidth } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = 180;
const PRODUCT_CARD_SPACING = 12;
const PRODUCT_TOTAL_WIDTH = PRODUCT_CARD_WIDTH + PRODUCT_CARD_SPACING;

const ProductsSection = memo(({ 
  title, 
  products, 
  isLoading, 
  navigation, 
  favorites, 
  onToggleFavorite, 
  onProductPress,
  onBookService,
  accentColor = '#5D3FD3',
  showSeeAll = true,
  seeAllParams = {},
  shimmerValue
}) => {
  // Memoized getItemLayout for FlatList optimization
  const getItemLayout = useCallback((data, index) => ({
    length: PRODUCT_TOTAL_WIDTH,
    offset: PRODUCT_TOTAL_WIDTH * index,
    index,
  }), []);

  // Memoized keyExtractor for better performance
  const keyExtractor = useCallback((item, index) => 
    item?._id ? item._id.toString() : `product-${index}`
  , []);

  // Memoized skeleton keyExtractor
  const skeletonKeyExtractor = useCallback((item, index) => 
    `skeleton-${index}`
  , []);

  // Optimized renderProduct with useCallback
  const renderProduct = useCallback(({ item }) => (
    <ProductCard
      item={item}
      isFavorite={favorites.includes(item._id)}
      onPress={() => onProductPress(item)}
      onToggleFavorite={onToggleFavorite}
      onBookService={onBookService}
    />
  ), [favorites, onProductPress, onToggleFavorite, onBookService]);

  // Optimized renderSkeleton with useCallback
  const renderSkeleton = useCallback(({ item, index }) => (
    <ProductSkeleton shimmerValue={shimmerValue} />
  ), [shimmerValue]);

  // Memoized skeleton data
  const skeletonData = useMemo(() => [1, 2, 3, 4], []);

  // Memoized empty component
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No products available</Text>
    </View>
  ), []);

  // Memoized see all handler
  const handleSeeAll = useCallback(() => {
    navigation.navigate('CategoriesScreen', seeAllParams);
  }, [navigation, seeAllParams]);

  if (isLoading) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionTitleAccent, { backgroundColor: accentColor }]}></View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {title.includes('Trending') && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          {showSeeAll && (
            <TouchableOpacity 
              style={styles.seeAllButton} 
              onPress={handleSeeAll}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={skeletonData}
          renderItem={renderSkeleton}
          keyExtractor={skeletonKeyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={2}
          updateCellsBatchingPeriod={50}
          bounces={false}
          scrollEventThrottle={16}
          disableIntervalMomentum={true}
          snapToInterval={PRODUCT_TOTAL_WIDTH}
          decelerationRate="fast"
        />
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleAccent, { backgroundColor: accentColor }]}></View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {title.includes('Trending') && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        {showSeeAll && (
          <TouchableOpacity 
            style={styles.seeAllButton} 
            onPress={handleSeeAll}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={ListEmptyComponent}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
        updateCellsBatchingPeriod={50}
        bounces={false}
        scrollEventThrottle={16}
        disableIntervalMomentum={true}
        snapToInterval={PRODUCT_TOTAL_WIDTH}
        decelerationRate="fast"
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.title === nextProps.title &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.products === nextProps.products &&
    prevProps.favorites === nextProps.favorites &&
    prevProps.accentColor === nextProps.accentColor &&
    prevProps.showSeeAll === nextProps.showSeeAll &&
    JSON.stringify(prevProps.seeAllParams) === JSON.stringify(nextProps.seeAllParams)
  );
});

ProductsSection.displayName = 'ProductsSection';

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleAccent: {
    width: 4,
    height: 20,
    backgroundColor: '#5D3FD3',
    marginRight: 8,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4757',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF4757',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  productsList: {
    paddingHorizontal: 12,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
  },
});

export default ProductsSection; 