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
  
  // Add debugging for route params
  console.log('🔍 CategoriesScreen - Route params:', route?.params);
  console.log('🔍 CategoriesScreen - Filter object:', route?.params?.filter);
  
  // Add default values to prevent undefined errors
  const { 
    categoryId = '1', 
    categoryName = 'Products', 
    featuredOnly = false, 
    services = false,
    newArrivals = false,
    trending = false,
    filter = {},
    isMainCategoryFilter = false
  } = route?.params || {};
  
  // Debug the extracted filter
  console.log('🔍 CategoriesScreen - Extracted filter:', filter);
  console.log('🔍 CategoriesScreen - Filter subcategory:', filter.subcategory);
  console.log('🔍 CategoriesScreen - Filter type:', typeof filter.subcategory);
  console.log('🔍 CategoriesScreen - Is array?', Array.isArray(filter.subcategory));
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Memoize the filter parameters to prevent unnecessary re-renders
  const filterParams = React.useMemo(() => ({
    categoryId,
    categoryName,
    featuredOnly,
    services,
    newArrivals,
    trending,
    filter,
    isMainCategoryFilter
  }), [categoryId, categoryName, featuredOnly, services, newArrivals, trending, JSON.stringify(filter), isMainCategoryFilter]);

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
          params.append('all', 'true'); // Fetch all featured products, not just 10
        }

        // Handle trending products - but NOT when we have specific filters like subcategory, searchTerm, etc.
        if (trending && !filter.subcategory && !filter.mainCategory && !filter.category && !filter.gender && !filter.searchTerm) {
          endpoint = `${API_BASE_URL}/api/products/trending`;
        } else if (filter.sortBy === 'views' && filter.sortOrder === 'desc' && !filter.subcategory && !filter.mainCategory && !filter.category && !filter.gender && !filter.searchTerm) {
          // If sorting by views, use the trending endpoint ONLY if no specific filters are applied
          endpoint = `${API_BASE_URL}/api/products/trending`;
        }

        // Add new arrivals filter
        if (newArrivals) {
          params.append('sortBy', 'createdAt');
          params.append('sortOrder', 'desc');
          params.append('limit', '20');
        }

        // Handle sorting parameters
        if (filter.sortBy) {
          if (filter.sortBy === 'views') {
            params.append('sort', 'views');
          } else if (filter.sortBy === 'createdAt') {
            params.append('sort', 'newest');
          }
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
        
        // Add any additional filters from the filter prop (except searchTerm, sortBy, sortOrder which we'll handle separately)
        if (filter && Object.keys(filter).length > 0) {
          Object.entries(filter).forEach(([key, value]) => {
            if (value && key !== 'categoryId' && key !== 'category' && key !== 'searchTerm' && key !== 'sortBy' && key !== 'sortOrder') {
              params.append(key, value);
            }
          });
        }

        // Construct final URL
        const finalEndpoint = `${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
        console.log('🔍 Using endpoint:', endpoint);
        console.log('🔍 Endpoint reason:', 
          featuredOnly ? 'featuredOnly' : 
          (trending && !filter.subcategory && !filter.mainCategory && !filter.category && !filter.gender && !filter.searchTerm) ? 'trending' :
          (filter.sortBy === 'views' && filter.sortOrder === 'desc' && !filter.subcategory && !filter.mainCategory && !filter.category && !filter.gender && !filter.searchTerm) ? 'trending (views sort)' :
          'default products endpoint'
        );
        console.log('Fetching products from:', finalEndpoint); // Debug log
        
        const response = await fetch(finalEndpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products. Status: ${response.status}`);
        }
        
        let fetchedData = await response.json();
        console.log('Fetched products:', fetchedData); // Debug log
        
        // Handle mainCategory filtering client-side (for Food & Drinks)
        if (isMainCategoryFilter && categoryName) {
          const categoryToMatch = categoryName.toLowerCase().trim();
          fetchedData = fetchedData.filter(product => {
            const productMainCategory = (product.mainCategory || '').toLowerCase();
            return productMainCategory === categoryToMatch;
          });
          
          console.log(`Filtered ${fetchedData.length} products for mainCategory: "${categoryName}"`);
        }
        
        // Handle searchTerm filtering client-side
        if (filter.searchTerm && filter.searchTerm.trim()) {
          const searchTerm = filter.searchTerm.toLowerCase().trim();
          console.log('🔍 Searching for term:', searchTerm);
          console.log('🔍 Total products before search:', fetchedData.length);
          
          fetchedData = fetchedData.filter(product => {
            const productName = (product.name || '').toLowerCase();
            const productDescription = (product.description || '').toLowerCase();
            const productCategory = (product.category || '').toLowerCase();
            const productSubcategory = (product.subcategory || '').toLowerCase();
            const productMainCategory = (product.mainCategory || '').toLowerCase();
            
            const nameMatch = productName.includes(searchTerm);
            const descMatch = productDescription.includes(searchTerm);
            const catMatch = productCategory.includes(searchTerm);
            const subcatMatch = productSubcategory.includes(searchTerm);
            const mainCatMatch = productMainCategory.includes(searchTerm);
            
            const matches = nameMatch || descMatch || catMatch || subcatMatch || mainCatMatch;
            
            console.log(`🔍 Product: ${product.name}`);
            console.log(`🔍   Name: "${productName}" (match: ${nameMatch})`);
            console.log(`🔍   Description: "${productDescription}" (match: ${descMatch})`);
            console.log(`🔍   Category: "${productCategory}" (match: ${catMatch})`);
            console.log(`🔍   Subcategory: "${productSubcategory}" (match: ${subcatMatch})`);
            console.log(`🔍   MainCategory: "${productMainCategory}" (match: ${mainCatMatch})`);
            console.log(`🔍   Overall match: ${matches}`);
            
            return matches;
          });
          
          console.log(`🔍 Filtered from ${fetchedData.length} products for search term: "${searchTerm}"`);
        }
        
        // Client-side filtering for mainCategory, subcategory, gender, etc.
        if (filter.mainCategory) {
          if (Array.isArray(filter.mainCategory)) {
            fetchedData = fetchedData.filter(product =>
              filter.mainCategory.map(s => s.toLowerCase()).includes((product.mainCategory || '').toLowerCase())
            );
          } else {
            fetchedData = fetchedData.filter(product =>
              (product.mainCategory || '').toLowerCase() === filter.mainCategory.toLowerCase()
            );
          }
        }
        if (filter.category) {
          if (Array.isArray(filter.category)) {
            fetchedData = fetchedData.filter(product =>
              filter.category.map(s => s.toLowerCase()).includes((product.category || '').toLowerCase())
            );
          } else {
            fetchedData = fetchedData.filter(product =>
              (product.category || '').toLowerCase() === filter.category.toLowerCase()
            );
          }
        }
        if (filter.subcategory) {
          console.log('🔍 Filtering by subcategory:', filter.subcategory);
          console.log('🔍 Subcategory type:', typeof filter.subcategory);
          console.log('🔍 Is array?', Array.isArray(filter.subcategory));
          
          if (Array.isArray(filter.subcategory)) {
            console.log('🔍 Filtering by subcategory array:', filter.subcategory);
            const beforeCount = fetchedData.length;
            fetchedData = fetchedData.filter(product => {
              const productSubcategory = (product.subcategory || '').toLowerCase();
              const matches = filter.subcategory.map(s => s.toLowerCase()).includes(productSubcategory);
              console.log(`🔍 Product: ${product.name}, Subcategory: ${product.subcategory}, Matches: ${matches}`);
              return matches;
            });
            console.log(`🔍 Filtered from ${beforeCount} to ${fetchedData.length} products for subcategory array`);
          } else {
            console.log('🔍 Filtering by single subcategory:', filter.subcategory);
            const beforeCount = fetchedData.length;
            fetchedData = fetchedData.filter(product => {
              const productSubcategory = (product.subcategory || '').toLowerCase();
              const filterSubcategory = filter.subcategory.toLowerCase();
              const matches = productSubcategory === filterSubcategory;
              console.log(`🔍 Product: ${product.name}, Subcategory: ${product.subcategory}, Filter: ${filter.subcategory}, Matches: ${matches}`);
              return matches;
            });
            console.log(`🔍 Filtered from ${beforeCount} to ${fetchedData.length} products for subcategory: "${filter.subcategory}"`);
          }
        }
        if (filter.gender) {
          if (Array.isArray(filter.gender)) {
            fetchedData = fetchedData.filter(product =>
              filter.gender.map(s => s.toLowerCase()).includes((product.gender || '').toLowerCase())
            );
          } else {
            fetchedData = fetchedData.filter(product =>
              (product.gender || '').toLowerCase() === filter.gender.toLowerCase()
            );
          }
        }
        // Price range filtering
        if (filter.minPrice !== undefined) {
          fetchedData = fetchedData.filter(product => Number(product.price) >= filter.minPrice);
        }
        if (filter.maxPrice !== undefined) {
          fetchedData = fetchedData.filter(product => Number(product.price) <= filter.maxPrice);
        }
        // Minimum rating filtering
        if (filter.minRating !== undefined) {
          fetchedData = fetchedData.filter(product => Number(product.rating) >= filter.minRating);
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
    // Prevent multiple rapid clicks
    if (addingToCart) {
      return;
    }
    
    // Check if user is authenticated
    if (!(await requireAuthentication(navigation, 'add items to cart'))) {
      return;
    }
    
    // Check if product has stock available - use stock field consistently
    const stockQuantity = product.stock || product.countInStock || 0;
    if (stockQuantity <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }
    
    setAddingToCart(true);
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
        console.error('Add to cart API error:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setAddingToCart(false);
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
        onPress={() => {
          // Navigate to ServiceDetails for services, ProductDetails for products
          if (item.isService) {
            navigation.navigate('ServiceDetails', { serviceId: item._id });
          } else {
            navigation.navigate('ProductDetails', { productId: item._id });
          }
        }}
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
              GH¢{price}
            </Text>
            {isOnSale && item.originalPrice && (
              <Text style={styles.originalPrice}>
                ${originalPrice}
              </Text>
            )}
          </View>
          
          {/* Stock status or service indicator */}
          {item.isService ? (
            <Text style={styles.serviceTag}>Service</Text>
          ) : (
            <>
              {(item.stock === undefined || item.stock === null || item.stock > 0) ? (
                <Text style={styles.inStock}>In Stock</Text>
              ) : (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}
              
              {/* Add to cart button - only show for non-service items */}
              <TouchableOpacity 
                style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
                onPress={() => handleAddToCart(item)}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={16} color="#fff" />
                    <Text style={styles.addToCartText}>Add</Text>
                  </>
                )}
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

  // Update getScreenTitle to include newArrivals and trending
  const getScreenTitle = () => {
    if (featuredOnly) return "Featured Products";
    if (services) return "Services";
    if (newArrivals) return "New Arrivals";
    if (trending) return "Trending Now";
    return categoryName || "Products";
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header that extends to the top of the screen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {getScreenTitle()}
        </Text>
      </View>

      {/* Content area with SafeAreaView */}
      <SafeAreaView style={styles.contentContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5D3FD3',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    height: Platform.OS === 'android' ? 56 + Constants.statusBarHeight : 'auto',
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
    // borderRadius: 4,
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
    // borderRadius: 4,
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
    borderRadius: 6,
    marginTop: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
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
