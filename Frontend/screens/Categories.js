import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  TextInput,
  ScrollView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { handleAddToCartNotification } from '../services/notificationService';
import { requireAuthentication } from '../App';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Categories = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, categoryName } = route.params || {};
  const dispatch = useDispatch();

  const API_URL = 'https://unimarket-ikin.onrender.com'; // Local development URL - CHANGE BACK FOR PRODUCTION!

  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity'); // popularity, price-low, price-high, newest
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [showingProductCategories, setShowingProductCategories] = useState(true); // Default to product categories
  const [buttonAnimations] = useState(() => new Map());
  
  // Stable callback for onViewableItemsChanged using useCallback to prevent re-creation
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    // Optional: Handle viewable items changes if needed
    // console.log('Viewable items:', viewableItems);
  }, []);
  
  // Stable viewabilityConfig using useRef to prevent any changes on re-renders
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
  });
  
  // Using the same category structure as in SellerDashboardScreen
  const categories = {
    PRODUCTS: {
      CLOTHING_FASHION: 'Clothing & Fashion',
      ELECTRONICS: 'Electronics & Gadgets',
      SCHOOL_SUPPLIES: 'School Supplies',
      FOOD_DRINKS: 'Food & Drinks',
      BEAUTY_SKINCARE: 'Beauty & Skincare',
      HEALTH_FITNESS: 'Health & Fitness',
      FURNITURE_HOME: 'Furniture & Home Items',
      EVENT_TICKETS: 'Event Tickets & Merchandise'
    },
    SERVICES: {
      HOSTEL_AGENTS: 'Hostel Agents',
      ASSIGNMENT_HELP: 'Assignment Assistance',
      GRAPHIC_DESIGN: 'Graphic Design',
      PHOTO_VIDEO: 'Photography & Videography',
      LAUNDRY: 'Laundry Services',
      BARBER_HAIR: 'Barbering & Hairdressing',
      MC_DJ: 'MCs & DJs for Events',
      TUTORING: 'Tutoring & Lessons',
      FREELANCE_WRITING: 'Freelance Writing',
      TECH_SUPPORT: 'Tech Support'
    }
  };
  
  useEffect(() => {
    console.log('useEffect triggered with selectedCategory:', selectedCategory);
    fetchProducts();
  }, [selectedCategory, showingProductCategories]);
  
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);
  
  const handleCategorySelect = (category) => {
    console.log('Selected category:', category);
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when changing categories
    
    // Reset sorting to default when changing categories
    setSortBy('popularity');
    
    // Close filter modal if open
    setFilterModalVisible(false);
  };
  
  const toggleCategoryType = () => {
    // Update the state with the new value
    const newValue = !showingProductCategories;
    setShowingProductCategories(newValue);
    setSelectedCategory('all'); // Reset selection when switching category types
    
    // Show loading indicator
    setLoading(true);
    
    // Use the new value directly in the fetch call to avoid state timing issues
    setTimeout(() => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        const categoryDisplayName = !newValue 
          ? categories.PRODUCTS[selectedCategory] 
          : categories.SERVICES[selectedCategory];
          
        if (categoryDisplayName) {
          // Filter by both mainCategory and category fields
          params.append('filter', JSON.stringify({
            $or: [
              { mainCategory: categoryDisplayName },
              { category: categoryDisplayName }
            ]
          }));
        }
      }
      
      // Use the newValue directly instead of relying on the state
      params.append('isService', !newValue ? 'true' : 'false');
      
      let url = `${API_URL}/api/products?${params.toString()}`;
      
      console.log('Toggling to URL:', url); // Debug log
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Toggled products/services:', data);
          console.log('Number of products after toggle:', Array.isArray(data) ? data.length : 0);
          
          // Filter products client-side as well
          const filteredData = data.filter(product => {
            const categoryDisplayName = !newValue 
              ? categories.PRODUCTS[selectedCategory] 
              : categories.SERVICES[selectedCategory];
              
            return selectedCategory === 'all' || 
                   product.mainCategory === categoryDisplayName ||
                   product.category === categoryDisplayName;
          });
          
          setProducts(filteredData);
          setError(null);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching after toggle:', err);
          setError('Failed to load. Please try again.');
          setProducts([]);
          setLoading(false);
        });
    }, 0);
  };
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Base URL
      const baseUrl = `${API_URL}/api/products`;
      const params = new URLSearchParams();
      
      // Handle category filtering
      if (selectedCategory && selectedCategory !== 'all') {
        // Convert category key to display name
        const categoryDisplayName = showingProductCategories 
          ? categories.PRODUCTS[selectedCategory] 
          : categories.SERVICES[selectedCategory];
          
        console.log('Selected Category:', selectedCategory);
        console.log('Category Display Name:', categoryDisplayName);
        
        if (categoryDisplayName) {
          // Filter by both mainCategory and category fields
          params.append('filter', JSON.stringify({
            $or: [
              { mainCategory: categoryDisplayName },
              { category: categoryDisplayName }
            ]
          }));
        }
      }
      
      // Handle service/product filtering
      params.append('isService', !showingProductCategories ? 'true' : 'false');
      
      // Construct final URL with proper encoding
      const url = `${baseUrl}?${params.toString()}`;
      console.log('Fetching products from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched products:', data);
      console.log('Number of products:', Array.isArray(data) ? data.length : 0);
      
      // Log both category and mainCategory of each product to verify filtering
      if (Array.isArray(data)) {
        data.forEach(product => {
          console.log(`Product ${product.name} - category: ${product.category}, mainCategory: ${product.mainCategory}`);
        });
        
        // Filter products client-side as well to ensure correct categorization
        const filteredData = data.filter(product => {
          const categoryDisplayName = showingProductCategories 
            ? categories.PRODUCTS[selectedCategory] 
            : categories.SERVICES[selectedCategory];
            
          return selectedCategory === 'all' || 
                 product.mainCategory === categoryDisplayName ||
                 product.category === categoryDisplayName;
        });
        
        setProducts(filteredData);
        setError(null);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]); // Clear products on error instead of using mock data
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (text) => {
    setSearchQuery(text);
  };
  
  const handleSort = (sortOption) => {
    setSortBy(sortOption);
    // Close filter modal if open
    setFilterModalVisible(false);
  };
  
  const getButtonAnimation = (productId) => {
    if (!buttonAnimations.has(productId)) {
      buttonAnimations.set(productId, new Animated.Value(1));
    }
    return buttonAnimations.get(productId);
  };

  const animateButton = (productId) => {
    const animation = getButtonAnimation(productId);
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animation, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddToCart = async (product) => {
    // Animate the button
    animateButton(product._id);
    
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
    }
  };
  
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default: // popularity
          return (b.rating || 0) - (a.rating || 0);
      }
    });
  
  const renderProduct = ({ item }) => {
    console.log('Product item:', item);
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `${API_URL}${item.image}`);
      
    const buttonScale = getButtonAnimation(item._id);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          // Navigate to different screens based on whether it's a service or product
          if (showingProductCategories) {
            navigation.navigate('ProductDetails', { productId: item._id });
          } else {
            navigation.navigate('ServiceDetails', { serviceId: item._id });
          }
        }}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.isNew && (
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>New</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => console.log('Add to favorites')}
          >
            <Ionicons name="heart-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.productDetails}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>GHC{item.price.toFixed(2)}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text style={styles.originalPrice}>GHC{item.originalPrice.toFixed(2)}</Text>
              )}
            </View>
          </View>
          <View style={styles.productFooter}>
            <View style={styles.sellerInfo}>
              <Ionicons name="person-outline" size={12} color="#666" />
              <Text style={styles.sellerText} numberOfLines={1}>{item.seller?.name || 'Unknown Seller'}</Text>
            </View>
            {showingProductCategories && (
              <Animated.View 
                style={[
                  styles.addToCartButton,
                  {
                    transform: [{ scale: buttonScale }],
                  }
                ]}
              >
                <TouchableOpacity 
                  onPress={() => handleAddToCart(item)}
                  style={styles.addToCartButtonInner}
                >
                  <Ionicons name="add-circle" size={24} color="#5D3FD3" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryName || (showingProductCategories ? 'All Products' : 'All Services')}
        </Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(!filterModalVisible)}
        >
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${showingProductCategories ? 'products' : 'services'}...`}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Sort Options */}
      {filterModalVisible && (
        <View style={styles.sortOptions}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'popularity' && styles.activeSortOption]}
            onPress={() => handleSort('popularity')}
          >
            <Text style={[styles.sortText, sortBy === 'popularity' && styles.activeSortText]}>
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'price-low' && styles.activeSortOption]}
            onPress={() => handleSort('price-low')}
          >
            <Text style={[styles.sortText, sortBy === 'price-low' && styles.activeSortText]}>
              Price: Low to High
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'price-high' && styles.activeSortOption]}
            onPress={() => handleSort('price-high')}
          >
            <Text style={[styles.sortText, sortBy === 'price-high' && styles.activeSortText]}>
              Price: High to Low
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'newest' && styles.activeSortOption]}
            onPress={() => handleSort('newest')}
          >
            <Text style={[styles.sortText, sortBy === 'newest' && styles.activeSortText]}>
              Newest First
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Toggle between Products and Services */}
      {!categoryId && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              showingProductCategories && styles.activeToggleButton
            ]}
            onPress={() => {
              if (!showingProductCategories) toggleCategoryType();
            }}
          >
            <MaterialIcons 
              name="shopping-bag" 
              size={18} 
              color={showingProductCategories ? "#fff" : "#666"} 
            />
            <Text style={[
              styles.toggleButtonText,
              showingProductCategories && styles.activeToggleButtonText
            ]}>
              Products
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              !showingProductCategories && styles.activeToggleButton
            ]}
            onPress={() => {
              if (showingProductCategories) toggleCategoryType();
            }}
          >
            <MaterialIcons 
              name="miscellaneous-services" 
              size={18} 
              color={!showingProductCategories ? "#fff" : "#666"} 
            />
            <Text style={[
              styles.toggleButtonText,
              !showingProductCategories && styles.activeToggleButtonText
            ]}>
              Services
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 
            (showingProductCategories ? 'product' : 'service') : 
            (showingProductCategories ? 'products' : 'services')} found
        </Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setFilterModalVisible(!filterModalVisible)}>
          <Text style={styles.sortButtonText}>Sort by: </Text>
          <Text style={styles.currentSortText}>
            {sortBy === 'popularity' ? 'Popular' : 
             sortBy === 'price-low' ? 'Price: Low to High' : 
             sortBy === 'price-high' ? 'Price: High to Low' : 'Newest'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5D3FD3" />
        </TouchableOpacity>
      </View>
      
      {/* Category Filter - Only show when viewing All Products/Services */}
      {!categoryId && (
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollView}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'all' && styles.selectedCategoryChip
              ]}
              onPress={() => handleCategorySelect('all')}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  selectedCategory === 'all' && styles.selectedCategoryChipText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {Object.entries(showingProductCategories ? categories.PRODUCTS : categories.SERVICES).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryChip,
                  selectedCategory === key && styles.selectedCategoryChip
                ]}
                onPress={() => handleCategorySelect(key)}
              >
                <Text 
                  style={[
                    styles.categoryChipText,
                    selectedCategory === key && styles.selectedCategoryChipText
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D3FD3" />
          <Text style={styles.loadingText}>
            Loading {showingProductCategories ? 'products' : 'services'}...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>
            {searchQuery ? 
              `No results found for "${searchQuery}"` : 
              `No ${showingProductCategories ? 'products' : 'services'} found in ${
                selectedCategory === 'all' ? 
                  'this category' : 
                  (showingProductCategories ? 
                    categories.PRODUCTS[selectedCategory] || 'this category' : 
                    categories.SERVICES[selectedCategory] || 'this category')
              }`}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 
              'Try different keywords or browse categories' : 
              'Try selecting a different category'}
          </Text>
          {selectedCategory !== 'all' && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => handleCategorySelect('all')}
            >
              <Text style={styles.viewAllButtonText}>
                View all {showingProductCategories ? 'products' : 'services'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          key={`${showingProductCategories}-${selectedCategory}`}
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfigRef.current}
        />
      )}
    </SafeAreaView>
  );
};

// Mock data for fallback
const MOCK_PRODUCTS = [
  {
    _id: '1',
    name: 'Premium Headphones',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3',
    rating: 4.8,
  },
  {
    _id: '2',
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3',
    rating: 4.5,
  },
  {
    _id: '3',
    name: 'Wireless Earbuds',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3',
    rating: 4.7,
  },
  {
    _id: '4',
    name: 'Bluetooth Speaker',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3',
    rating: 4.6,
  },
  {
    _id: '5',
    name: 'Fitness Tracker',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?ixlib=rb-4.0.3',
    rating: 4.3,
  },
  {
    _id: '6',
    name: 'Portable Charger',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?ixlib=rb-4.0.3',
    rating: 4.4,
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'android' ? 25 : 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  sortOptions: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeSortOption: {
    backgroundColor: '#f0e6ff',
  },
  sortText: {
    fontSize: 14,
    color: '#333',
  },
  activeSortText: {
    color: '#5D3FD3',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  currentSortText: {
    fontSize: 14,
    color: '#5D3FD3',
    fontWeight: '500',
    marginRight: 4,
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '47%',
  },
  productImageContainer: {
    position: 'relative',
    height: 100,
    backgroundColor: '#f8f8f8',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
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
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  productDetails: {
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  addToCartButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeToggleButton: {
    backgroundColor: '#5D3FD3',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeToggleButtonText: {
    color: '#fff',
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesScrollView: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryChip: {
    backgroundColor: '#5D3FD3',
    borderColor: '#5D3FD3',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  viewAllButton: {
    marginTop: 16,
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Categories;
