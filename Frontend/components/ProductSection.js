import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from './ProductCard';

const { width: screenWidth } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = 180;
const PRODUCT_CARD_SPACING = 12;
const PRODUCT_TOTAL_WIDTH = PRODUCT_CARD_WIDTH + PRODUCT_CARD_SPACING;

const ProductSection = memo(({ 
  title, 
  products, 
  loading, 
  navigation, 
  favorites, 
  onToggleFavorite, 
  onProductPress,
  onBookService,
  accentColor = '#5D3FD3',
  showSeeAll = true,
  seeAllParams = {},
  emptyMessage = "No items found",
  icon = "heart-outline"
}) => {
  console.log(`ProductSection ${title}:`, { loading, productsLength: products?.length, products });
  
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

  // Don't render anything if loading or no products
  if (loading || products.length === 0) {
    console.log(`ProductSection ${title}: Not rendering - loading: ${loading}, products.length: ${products?.length}`);
    return null;
  }

  console.log(`ProductSection ${title}: Rendering with ${products.length} products`);
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleAccent, { backgroundColor: accentColor }]}></View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {showSeeAll && products.length > 3 && (
          <TouchableOpacity 
            style={styles.seeAllButton} 
            onPress={() => navigation.navigate('CategoriesScreen', seeAllParams)}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={products.slice(0, 4)} // Show only first 4 items
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
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
      />
    </View>
  );
});

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
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
    color: '#5D3FD3',
    fontWeight: '500',
  },
  productsList: {
    paddingHorizontal: 12,
  },
});

export default ProductSection; 