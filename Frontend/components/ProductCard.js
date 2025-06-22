import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

const ProductCard = memo(({ 
  item, 
  isFavorite, 
  onPress, 
  onToggleFavorite, 
  onAddToCart,
  onBookService 
}) => {
  const imageUri = item.image && (item.image.startsWith('http') 
    ? item.image 
    : `${API_BASE_URL}${item.image}`);

  return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={onPress}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.productImage}
          onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          onLoad={() => console.log('Image loaded successfully:', imageUri)}
        />
        {/* Show New badge only for new products */}
        {item.isNew === true && (
          <View style={[styles.productBadge, { backgroundColor: '#FF6B6B' }]}>
            <Text style={styles.productBadgeText}>New</Text>
          </View>
        )}
        {/* Show Out of Stock badge only for non-service products with zero stock and not new */}
        {!item.isNew && !item.isService && item.countInStock === 0 && (
          <View style={[styles.productBadge, { backgroundColor: '#FF4757' }]}>
            <Text style={styles.productBadgeText}>Out of Stock</Text>
          </View>
        )}
        {/* Show Service badge for services */}
        {item.isService && (
          <View style={[styles.productBadge, { backgroundColor: '#4ECDC4' }]}>
            <Text style={styles.productBadgeText}>Service</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(item._id);
          }}
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
            <Text style={styles.productPrice}>GH¢{item.price.toFixed(2)}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>GH¢{item.originalPrice.toFixed(2)}</Text>
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
              onPress={() => onBookService(item)}
            >
              <Ionicons name="calendar" size={20} color="#4ECDC4" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
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