import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { handleAddToCartNotification } from '../services/notificationService';
import { requireAuthentication } from '../App';

const CategoryScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  // Add default values to prevent undefined errors
  const { 
    categoryId = '1', 
    categoryName = 'Products', 
    featuredOnly = false, 
    services = false,
    newArrivals = false,
    filter = {}
  } = route?.params || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the filter parameters to prevent unnecessary re-renders
  const filterParams = React.useMemo(() => ({
    categoryId,
    categoryName,
    featuredOnly,
    services,
    newArrivals,
    filter
  }), [categoryId, categoryName, featuredOnly, services, newArrivals, JSON.stringify(filter)]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProducts = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Base endpoint for products
        let endpoint = `${API_BASE_URL}/api/products`;
        let params = new URLSearchParams();
        
        // Handle different endpoint scenarios
        if (featuredOnly) {
          endpoint = `${API_BASE_URL}/api/products/featured`;
        }

        // Add new arrivals filter
        if (newArrivals) {
          params.append('sortBy', 'createdAt');
          params.append('sortOrder', 'desc');
          params.append('limit', '20');
        }

        // Add category filtering - check both categoryId and category name
        if (filter.categoryId) {
          params.append('categoryId', filter.categoryId);
        }
        if (filter.category) {
          params.append('category', filter.category);
        }

        // Add service/product filter
        params.append('isService', services ? 'true' : 'false');
        
        // Add any additional filters from the filter prop (except searchTerm which we'll handle client-side)
        if (filter && Object.keys(filter).length > 0) {
          Object.entries(filter).forEach(([key, value]) => {
            if (value && key !== 'categoryId' && key !== 'category' && key !== 'searchTerm') {
              params.append(key, value);
            }
          });
        }

        // Construct final URL
        const finalEndpoint = `${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
        console.log('Fetching products from:', finalEndpoint); // Debug log
        
        const response = await fetch(finalEndpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products. Status: ${response.status}`);
        }
        
        let fetchedData = await response.json();
        console.log('Fetched products:', fetchedData); // Debug log
        
        // Handle searchTerm filtering client-side
        if (filter.searchTerm && filter.searchTerm.trim()) {
          const searchTerm = filter.searchTerm.toLowerCase().trim();
          fetchedData = fetchedData.filter(product => {
            const productName = (product.name || '').toLowerCase();
            const productDescription = (product.description || '').toLowerCase();
            const productCategory = (product.category || '').toLowerCase();
            const productSubcategory = (product.subcategory || '').toLowerCase();
            const productMainCategory = (product.mainCategory || '').toLowerCase();
            
            return productName.includes(searchTerm) ||
                   productDescription.includes(searchTerm) ||
                   productCategory.includes(searchTerm) ||
                   productSubcategory.includes(searchTerm) ||
                   productMainCategory.includes(searchTerm);
          });
          
          console.log(`Filtered ${fetchedData.length} products for search term: "${searchTerm}"`);
        }
        
        if (isMounted) {
          setProducts(fetchedData);
          if (fetchedData.length === 0) {
            setError(`No products found in ${categoryName || 'this category'}`);
          }
        }
        
      } catch (error) {
        console.error('Error fetching products:', error); // Debug log
        if (isMounted) {
          setError(error.message);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    return () => {
      isMounted = false;
    };
  }, [filterParams]); // Only depend on the memoized filterParams

  const handleAddToCart = async (product) => {
    // Check if user is authenticated
    if (!(await requireAuthentication(navigation, 'add items to cart'))) {
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Token is guaranteed to exist at this point because of requireAuthentication
      
      // Make API call to add to cart
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      });
      
      if (response.ok) {
        // Send notification
        await handleAddToCartNotification(product.name, dispatch);
        Alert.alert('Success', 'Product added to cart');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const renderProductItem = ({ item }) => {
    // Handle proper image path
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `${API_BASE_URL}${item.image}`);
    
    // Determine if the product is on sale (example condition)
    const isOnSale = item.discountPercentage && item.discountPercentage > 0;
    
    // Make sure price is a number before calling toFixed
    const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
    const originalPrice = isOnSale && typeof item.originalPrice === 'number' ? 
      item.originalPrice.toFixed(2) : '0.00';
    
    return (
      <TouchableOpacity 
        style={styles.productItem}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.productImage}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          />
          {isOnSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>-{item.discountPercentage}%</Text>
            </View>
          )}
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={22} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
            {item.name || 'Product Name'}
          </Text>
          
          {/* Rating */}
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              {item.numReviews && (
                <Text style={styles.reviewCount}>({item.numReviews})</Text>
              )}
            </View>
          )}
          
          {/* Price section */}
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              <Text>GH¢</Text>
              {price}
            </Text>
            {isOnSale && item.originalPrice && (
              <Text style={styles.originalPrice}>
                <Text>$</Text>
                {originalPrice}
              </Text>
            )}
          </View>
          
          {/* Stock status or service indicator */}
          {item.isService ? (
            <Text style={styles.serviceTag}>Service</Text>
          ) : (
            <>
              {(item.countInStock === undefined || item.countInStock === null || item.countInStock > 0) ? (
                <Text style={styles.inStock}>In Stock</Text>
              ) : (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}
              
              {/* Add to cart button - only show for non-service items */}
              <TouchableOpacity 
                style={styles.addToCartButton}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="cart-outline" size={16} color="#fff" />
                <Text style={styles.addToCartText}>Add</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={70} color="#e74c3c" />
        <Text style={styles.emptyStateTitle}>Error Loading Products</Text>
        <Text style={styles.emptyStateText}>{error}</Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.browseButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Update getScreenTitle to include newArrivals
  const getScreenTitle = () => {
    if (featuredOnly) return "Featured Products";
    if (services) return "Services";
    if (newArrivals) return "New Arrivals";
    return categoryName || "Products";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {getScreenTitle()}
        </Text>
      
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={70} color="#e74c3c" />
          <Text style={styles.emptyStateTitle}>Error Loading Products</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.browseButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={70} color="#ddd" />
          <Text style={styles.emptyStateTitle}>No Products Found</Text>
          <Text style={styles.emptyStateText}>
            We couldn't find any products matching "{categoryName || 'this category'}".
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.browseButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key="product-list"
          data={products}
          keyExtractor={(item) => item._id ? item._id.toString() : Math.random().toString()}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#5D3FD3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
    height: Platform.OS === 'android' ? 56 : 'auto',
  },
  backButton: {
    padding: 6,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Platform.OS === 'android' ? 18 : 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 4,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  searchButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minWidth: 36,
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    backgroundColor: '#fff',
    // borderRadius: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 20,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#888',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 5,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  serviceTag: {
    fontSize: 12,
    color: '#6a5acd',
    marginBottom: 8,
    fontWeight: '500',
  },
  inStock: {
    fontSize: 12,
    color: '#2ecc71',
    marginBottom: 8,
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 8,
    fontWeight: '500',
  },
  addToCartButton: {
    backgroundColor: '#5D3FD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    // borderRadius: 10,
    marginTop: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryScreen;
