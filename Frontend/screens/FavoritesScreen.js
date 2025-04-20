import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();

  // Check authentication status when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
          // Redirect to login if not authenticated
          Alert.alert(
            'Authentication Required',
            'Please log in or sign up to view your favorites',
            [
              { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
              { text: 'Login', onPress: () => navigation.navigate('Login') }
            ]
          );
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          // Load favorites only if user is authenticated
          loadFavorites();
        }
      };
      
      checkAuth();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Get favorite IDs from AsyncStorage
      const storedFavorites = await AsyncStorage.getItem('favorites');
      const favoriteIds = storedFavorites ? JSON.parse(storedFavorites) : [];
      setFavorites(favoriteIds);
      
      if (favoriteIds.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      // Fetch product details for each favorite ID
      const response = await fetch('http://172.20.10.3:5000/api/products');
      if (response.ok) {
        const allProducts = await response.json();
        // Filter products to only include favorites
        const favorites = allProducts.filter(product => favoriteIds.includes(product._id));
        setFavoriteProducts(favorites);
      } else {
        console.log('Failed to fetch products');
        Alert.alert('Error', 'Failed to load favorite products');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorite products');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId) => {
    try {
      // Remove from local state
      const updatedFavorites = favorites.filter(id => id !== productId);
      setFavorites(updatedFavorites);
      
      // Update favorites list by removing the product
      setFavoriteProducts(favoriteProducts.filter(product => product._id !== productId));
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      
      // Display removal confirmation
      Alert.alert('Success', 'Product removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove product from favorites');
    }
  };

  const renderFavoriteItem = ({ item }) => {
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `http://172.20.10.3:5000${item.image}`);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.productImage}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          />
          {item.isNew && (
            <View style={[styles.productBadge, { backgroundColor: '#FF6B6B' }]}>
              <Text style={styles.productBadgeText}>New</Text>
            </View>
          )}
          {item.isService && (
            <View style={[styles.productBadge, { backgroundColor: '#4ECDC4' }]}>
              <Text style={styles.productBadgeText}>Service</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => removeFavorite(item._id)}
          >
            <Ionicons name="heart" size={20} color="#FF4757" />
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
            {item.rating && (
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name={star <= Math.floor(item.rating) ? "star" : "star-outline"} 
                      size={14} 
                      color="#FFD700" 
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
          <View style={styles.productFooter}>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeFavorite(item._id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addToCartButton}>
              <Ionicons name="cart" size={18} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No favorites yet</Text>
      <Text style={styles.emptySubtext}>Items added to your favorites will appear here</Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => navigation.navigate('BuyerHome')}
      >
        <Text style={styles.browseButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#5D3FD3" />
      <Text style={styles.loadingText}>Loading your favorites...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Only render content if authenticated */}
      {isAuthenticated ? (
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Favorites</Text>
            <View style={styles.placeholder} />
          </View>
          
          {loading ? renderLoadingState() : (
            favoriteProducts.length === 0 ? renderEmptyState() : (
              <FlatList
                data={favoriteProducts}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.productsList}
                numColumns={2}
                showsVerticalScrollIndicator={false}
              />
            )
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: Platform.OS === 'android' ? 25 : 0,

  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  productsList: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    position: 'relative',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#5D3FD3',
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FavoritesScreen; 