import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './OptimizedImage';

const ProductCard = memo(({ 
  item, 
  isFavorite, 
  onPress, 
  onToggleFavorite, 
  onAddToCart,
  onBookService 
}) => {
  // Memoize image URI calculation
  const imageUri = useMemo(() => {
    if (!item.image) return null;
    return item.image.startsWith('http') 
      ? item.image 
      : `${API_BASE_URL}${item.image}`;
  }, [item.image]);

  // Memoize favorite toggle handler
  const handleToggleFavorite = useCallback((e) => {
    e.stopPropagation();
    onToggleFavorite(item._id);
  }, [onToggleFavorite, item._id]);

  // Memoize book service handler
  const handleBookService = useCallback(() => {
    onBookService(item);
  }, [onBookService, item]);

  // Memoize press handler
  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  // Memoize price display
  const priceDisplay = useMemo(() => {
    if (!item.price) return null;
    return `GH¢${item.price.toFixed(2)}`;
  }, [item.price]);

  // Memoize original price display
  const originalPriceDisplay = useMemo(() => {
    if (!item.originalPrice) return null;
    return `GH¢${item.originalPrice.toFixed(2)}`;
  }, [item.originalPrice]);

  // Memoize badge rendering
  const badgeContent = useMemo(() => {
    if (item.isNew === true) {
      return (
        <View style={[styles.productBadge, { backgroundColor: '#FF6B6B' }]}>
          <Text style={styles.productBadgeText}>New</Text>
        </View>
      );
    }
    
    if (!item.isNew && !item.isService && item.countInStock === 0) {
      return (
        <View style={[styles.productBadge, { backgroundColor: '#FF4757' }]}>
          <Text style={styles.productBadgeText}>Out of Stock</Text>
        </View>
      );
    }
    
    if (item.isService) {
      return (
        <View style={[styles.productBadge, { backgroundColor: '#4ECDC4' }]}>
          <Text style={styles.productBadgeText}>Service</Text>
        </View>
      );
    }
    
    return null;
  }, [item.isNew, item.isService, item.countInStock]);

  return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        <OptimizedImage 
          source={imageUri}
          style={styles.productImage}
          resizeMode="cover"
          placeholderColor="#f0f0f0"
          showLoadingIndicator={false}
          imageType="thumbnail"
          preload={false}
        />
        {badgeContent}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={isFavorite ? "#FFD700" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.productDetails}>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{priceDisplay}</Text>
            {originalPriceDisplay && (
              <Text style={styles.originalPrice}>{originalPriceDisplay}</Text>
            )}
          </View>
          {/* number of views */}
          <View style={styles.viewsContainer}>
            <Ionicons name="eye-outline" size={12} color="#666" />
            <Text style={styles.viewsText}>{item.views || 0}</Text>
          </View>
        </View>
        <View style={styles.productFooter}>
          <View style={styles.sellerInfo}>
            {item.isService ? (
              <>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.sellerText}>Available Now</Text>
              </>
            ) : (
              <>
                <Ionicons name="car-outline" size={12} color="#666" />
                <Text style={styles.sellerText}>15% off delivery</Text>
              </>
            )}
          </View>
          {item.isService && (
            <TouchableOpacity 
              style={styles.bookServiceButton}
              onPress={handleBookService}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={20} color="#4ECDC4" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.item.views === nextProps.item.views &&
    prevProps.item.countInStock === nextProps.item.countInStock &&
    prevProps.item.isService === nextProps.item.isService &&
    prevProps.item.isNew === nextProps.item.isNew
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  productCard: {
    width: 180,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImageContainer: {
    position: 'relative',
    height: 100,
  },
  productImage: {
    width: '95%',
    height: '90%',
    backgroundColor: '#f0f0f0',
    resizeMode: 'contain',
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  viewsText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  bookServiceButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductCard; 