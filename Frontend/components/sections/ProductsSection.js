import React, { memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../ProductCard';
import { ProductSkeleton } from '../SkeletonComponents';

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
  const renderProduct = ({ item }) => (
    <ProductCard
      item={item}
      isFavorite={favorites.includes(item._id)}
      onPress={() => onProductPress(item)}
      onToggleFavorite={onToggleFavorite}
      onBookService={onBookService}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionTitleAccent, { backgroundColor: accentColor }]}></View>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          {showSeeAll && (
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
          data={[1, 2, 3, 4]}
          renderItem={() => <ProductSkeleton shimmerValue={shimmerValue} />}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
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
        </View>
        {showSeeAll && (
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
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No products available</Text>
          </View>
        )}
      />
    </View>
  );
});

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