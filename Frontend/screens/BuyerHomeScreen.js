import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import NotificationCenter from '../components/NotificationCenter';
import { requireAuthentication } from '../utils/authUtils';
import { API_BASE_URL } from '../config/api';
import * as Speech from 'expo-speech';

// Import extracted components
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import BottomNavigation from '../components/BottomNavigation';
import ProductsSection from '../components/sections/ProductsSection';
import CategoriesSection from '../components/sections/CategoriesSection';

// Import skeleton components
import { 
  ProductSkeleton, 
  BannerSkeleton, 
  CategorySkeleton, 
  ServiceSkeleton, 
  DealSkeleton, 
  BrandSkeleton 
} from '../components/SkeletonComponents';

// Import custom hooks
import { useLocation } from '../hooks/useLocation';
import { useProducts } from '../hooks/useProducts';
import { useFavorites } from '../hooks/useFavorites';
import { useUser } from '../hooks/useUser';
import { useBanners } from '../hooks/useBanners';

// Import services
import { productService } from '../services/productService';

// Mock data
const SPECIAL_OFFERS = [
  {
    id: '1',
    backgroundImage: 'https://i.pinimg.com/736x/9e/1e/49/9e1e498dc20cd0bc7b0c51464c3fc1ee.jpg'
  },
  {
    id: '2',
    backgroundImage: 'https://i.pinimg.com/736x/d9/56/33/d95633c798707a3fbb4006d2951b04ee.jpg'
  },
  {
    id: '3',
    backgroundImage: 'https://i.pinimg.com/736x/2c/8a/fa/2c8afaa91b320839978894a63f332b17.jpg'
  }
];

const BuyerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [specialOffers, setSpecialOffers] = useState(SPECIAL_OFFERS);
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef(null);
  
  // Get cart items from Redux store
  const { items: cartItems } = useSelector(state => state.cart);

  // Custom hooks
  const { location } = useLocation();
  const { 
    featuredProducts, 
    setFeaturedProducts, 
    newArrivals,
    setNewArrivals,
    services, 
    isLoadingProducts, 
    setIsLoadingProducts,
    isLoadingServices, 
    setIsLoadingServices,
    isLoadingNewArrivals,
    setIsLoadingNewArrivals,
    searchTimeoutRef: productsSearchTimeoutRef,
    fetchProducts,
    fetchServices,
    handleSearch,
    fetchOriginalProducts,
    fetchProductsByCategory 
  } = useProducts();
  const { favorites, toggleFavorite, reloadFavorites } = useFavorites(navigation);
  const { userName, isSeller, reloadUserData } = useUser();
  const { banners, isLoadingBanners, setIsLoadingBanners, reloadBanners } = useBanners();

  // Shimmer animation
  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
  }, []);

  // Auto-scroll special offers
  useEffect(() => {
    let interval;
    
    const startAutoScroll = () => {
      interval = setInterval(() => {
        const nextIndex = (activeOfferIndex + 1) % specialOffers.length;
        setActiveOfferIndex(nextIndex);
      }, 3000);
    };
    
    startAutoScroll();
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeOfferIndex, specialOffers.length]);

  // Loading states for static data
  useEffect(() => {
    // Simulate loading for categories
    setIsLoadingCategories(true);
    setTimeout(() => {
      setIsLoadingCategories(false);
    }, 1000);

    // Simulate loading for deals
    setIsLoadingDeals(true);
    setTimeout(() => {
      setIsLoadingDeals(false);
    }, 1000);

    // Simulate loading for brands
    setIsLoadingBrands(true);
    setTimeout(() => {
      setIsLoadingBrands(false);
    }, 1000);
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Event handlers
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If text is empty, reset to original products
    if (!text.trim()) {
      fetchOriginalProducts();
      return;
    }
    
    // Set a timeout to debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(text);
    }, 500);
  };

  const handleProductPress = async (product) => {
    console.log('Navigating to product details with ID:', product._id);
    
    // Check if this is a service and navigate accordingly
    if (product.isService || product.category === 'service') {
      navigation.navigate('ServiceDetails', { 
        serviceId: product._id
      });
      return;
    }
    
    try {
      // Increment views
      const newViews = await productService.incrementViews(product._id);
      
      if (newViews !== null) {
        // Update the local state to reflect the new view count
        setFeaturedProducts(prevProducts => 
          prevProducts.map(p => 
            p._id === product._id 
              ? { ...p, views: newViews }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
    
    navigation.navigate('ProductDetails', { 
      productId: product._id
    });
  };

  const handleBookService = async (service) => {
    if (!(await requireAuthentication(navigation, 'book a service'))) {
      return;
    }
    
    navigation.navigate('ServiceBooking', {
      service: service
    });
  };

  const handleAddToCart = async (product) => {
    if (!(await requireAuthentication(navigation, 'add items to cart'))) {
      return;
    }
    
    await productService.addToCart(product, dispatch);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Reset all loading states
      setIsLoadingProducts(true);
      setIsLoadingBanners(true);
      setIsLoadingServices(true);
      setIsLoadingCategories(true);
      setIsLoadingNewArrivals(true);
      setIsLoadingDeals(true);
      setIsLoadingBrands(true);

      // Fetch all data
      await Promise.all([
        fetchProducts(),
        fetchServices(),
        reloadBanners(),
        reloadUserData(),
        reloadFavorites()
      ]);

      // Simulate minimum loading time for better UX
      setTimeout(() => {
        setIsLoadingProducts(false);
        setIsLoadingBanners(false);
        setIsLoadingServices(false);
        setIsLoadingCategories(false);
        setIsLoadingNewArrivals(false);
        setIsLoadingDeals(false);
        setIsLoadingBrands(false);
        setRefreshing(false);
      }, 1000);

    } catch (error) {
      console.error('Error during refresh:', error);
      setTimeout(() => {
        setIsLoadingProducts(false);
        setIsLoadingBanners(false);
        setIsLoadingServices(false);
        setIsLoadingCategories(false);
        setIsLoadingNewArrivals(false);
        setIsLoadingDeals(false);
        setIsLoadingBrands(false);
        setRefreshing(false);
      }, 1000);
    }
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  const handleSellerDashboardPress = () => {
    navigation.navigate('SellerDashboard');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Memoize expensive computations
  const memoizedSortedProducts = useMemo(() => {
    return [...featuredProducts].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, [featuredProducts]);

  // Create sections data for FlatList
  const sectionsData = useMemo(() => {
    const sections = [];
    
    // Banner section
    sections.push({
      type: 'banner',
      id: 'banner-section',
      data: banners,
      isLoading: isLoadingBanners
    });
    
    // Categories section
    sections.push({
      type: 'categories',
      id: 'categories-section',
      isLoading: isLoadingCategories
    });
    
    // Featured products section
    sections.push({
      type: 'products',
      id: 'featured-products',
      title: 'Featured Products',
      data: featuredProducts,
      isLoading: isLoadingProducts,
      accentColor: '#5D3FD3',
      seeAllParams: { featuredOnly: true }
    });
    
    // New arrivals section
    sections.push({
      type: 'products',
      id: 'new-arrivals',
      title: 'New Arrivals',
      data: newArrivals.slice(0, 3),
      isLoading: isLoadingNewArrivals,
      accentColor: '#5D3FD3',
      seeAllParams: { newArrivals: true }
    });
    
    // Services section
    sections.push({
      type: 'products',
      id: 'services',
      title: 'Services',
      data: services,
      isLoading: isLoadingServices,
      accentColor: '#4ECDC4',
      seeAllParams: { services: true }
    });
    
    // Trending categories
    sections.push({
      type: 'trending-categories',
      id: 'trending-categories'
    });
    
    // Special offers
    sections.push({
      type: 'special-offers',
      id: 'special-offers',
      isLoading: isLoadingDeals
    });
    
    // Featured brands
    sections.push({
      type: 'featured-brands',
      id: 'featured-brands',
      isLoading: isLoadingBrands
    });
    
    // Recommended section
    sections.push({
      type: 'recommended',
      id: 'recommended',
      data: memoizedSortedProducts,
      isLoading: isLoadingProducts
    });
    
    return sections;
  }, [
    banners, isLoadingBanners,
    isLoadingCategories,
    featuredProducts, isLoadingProducts,
    newArrivals, isLoadingNewArrivals,
    services, isLoadingServices,
    isLoadingDeals, isLoadingBrands,
    memoizedSortedProducts
  ]);

  // Memoized keyExtractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Memoized getItemLayout for better performance
  const getItemLayout = useCallback((data, index) => {
    const ESTIMATED_ITEM_SIZE = 300; // Estimate based on your sections
    return {
      length: ESTIMATED_ITEM_SIZE,
      offset: ESTIMATED_ITEM_SIZE * index,
      index,
    };
  }, []);

  // Optimized render functions with useCallback
  const renderBannerSection = useCallback((item) => (
    <View style={styles.specialOffersContainer}>
      <View style={styles.specialOffersHeader}>
        <Text style={styles.specialOffersTitle}>#SpecialForYou</Text>
      </View>
      <BannerCarousel
        banners={item.data}
        isLoading={item.isLoading}
        navigation={navigation}
        BannerSkeleton={BannerSkeleton}
      />
    </View>
  ), [navigation]);

  const renderCategoriesSection = useCallback((item) => (
    <CategoriesSection
      isLoading={item.isLoading}
      navigation={navigation}
    />
  ), [navigation]);

  const renderProductsSection = useCallback((item) => (
    <ProductsSection
      title={item.title}
      products={item.data}
      isLoading={item.isLoading}
      navigation={navigation}
      favorites={favorites}
      onToggleFavorite={toggleFavorite}
      onProductPress={handleProductPress}
      onBookService={handleBookService}
      accentColor={item.accentColor}
      seeAllParams={item.seeAllParams}
      shimmerValue={shimmerValue}
    />
  ), [favorites, toggleFavorite, handleProductPress, handleBookService, shimmerValue]);

  const renderTrendingCategoriesSection = useCallback(() => (
    renderTrendingCategoriesGrid()
  ), []);

  const renderSpecialOffersSection = useCallback((item) => (
    <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleAccent, {backgroundColor: '#5D3FD3'}]}></View>
          <Text style={styles.sectionTitle}>Special Offers & Deals</Text>
        </View>
      </View>
      {renderDealsSection(item.isLoading)}
    </View>
  ), []);

  const renderFeaturedBrandsSection = useCallback((item) => (
    <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleAccent, {backgroundColor: '#6c5ce7'}]}></View>
          <Text style={styles.sectionTitle}>Featured Brands</Text>
        </View>
      </View>
      <View style={styles.brandContainer}>
        {renderBrandsSection(item.isLoading)}
      </View>
    </View>
  ), []);

  const renderRecommendedProducts = useCallback((item) => (
    <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleAccent, {backgroundColor: '#FF6B6B'}]}></View>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
        </View>
        <TouchableOpacity 
          style={styles.seeAllButton} 
          onPress={() => navigation.navigate('CategoriesScreen', { recommended: true })}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
        </TouchableOpacity>
      </View>

      {item.isLoading ? (
        <View style={styles.recommendedGridContainer}>
          <View style={styles.recommendedRow}>
            {[1, 2].map((item) => (
              <View key={item} style={styles.recommendedGridItem}>
                <ProductSkeleton shimmerValue={shimmerValue} />
              </View>
            ))}
          </View>
          <View style={styles.recommendedRow}>
            {[3, 4].map((item) => (
              <View key={item} style={styles.recommendedGridItem}>
                <ProductSkeleton shimmerValue={shimmerValue} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.recommendedGridContainer}>
          {Array.from({ length: Math.ceil(item.data.length / 2) }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.recommendedRow}>
              {item.data.slice(rowIndex * 2, rowIndex * 2 + 2).map((product) => (
                <TouchableOpacity 
                  key={product._id}
                  style={styles.recommendedGridItem}
                  onPress={() => handleProductPress(product)}
                >
                  <ProductCard
                    item={product}
                    isFavorite={favorites.includes(product._id)}
                    onPress={() => handleProductPress(product)}
                    onToggleFavorite={toggleFavorite}
                    onBookService={handleBookService}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  ), [navigation, handleProductPress, favorites, toggleFavorite, handleBookService, shimmerValue]);

  // Main render function for FlatList items
  const renderSection = useCallback(({ item }) => {
    switch (item.type) {
      case 'banner':
        return renderBannerSection(item);
      case 'categories':
        return renderCategoriesSection(item);
      case 'products':
        return renderProductsSection(item);
      case 'trending-categories':
        return renderTrendingCategoriesSection();
      case 'special-offers':
        return renderSpecialOffersSection(item);
      case 'featured-brands':
        return renderFeaturedBrandsSection(item);
      case 'recommended':
        return renderRecommendedProducts(item);
      default:
        return null;
    }
  }, [
    renderBannerSection,
    renderCategoriesSection,
    renderProductsSection,
    renderTrendingCategoriesSection,
    renderSpecialOffersSection,
    renderFeaturedBrandsSection,
    renderRecommendedProducts
  ]);

  // Render functions for sections
  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;

    return (
      <View style={styles.searchResultsContainer}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5D3FD3" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchError ? (
          <Text style={styles.errorText}>{searchError}</Text>
        ) : featuredProducts.length > 0 ? (
          <FlatList
            data={featuredProducts}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                isFavorite={favorites.includes(item._id)}
                onPress={() => handleProductPress(item)}
                onToggleFavorite={toggleFavorite}
                onBookService={handleBookService}
              />
            )}
            keyExtractor={(item) => item._id}
            horizontal={false}
            numColumns={2}
            contentContainerStyle={styles.searchResultsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#5D3FD3']}
                tintColor="#5D3FD3"
                title="Pull to refresh"
                titleColor="#5D3FD3"
              />
            }
          />
        ) : searchQuery.trim() ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>No products found for "{searchQuery}"</Text>
            <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderDealsSection = (isLoading) => {
    if (isLoading) {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsContainer}>
          {[1, 2, 3].map((item) => (
            <DealSkeleton key={item} shimmerValue={shimmerValue} />
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsContainer}>
        {/* Flash Sale Card */}
        <TouchableOpacity style={styles.dealCard}>
          <View style={[styles.dealBadge, { backgroundColor: '#5D3FD3' }]}>
            <Text style={styles.dealBadgeText}>50% OFF</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' }}
            style={styles.dealImage}
          />
          <View style={styles.dealInfo}>
            <Text style={styles.dealTitle}>Flash Sale</Text>
            <Text style={styles.dealDescription}>Ends in 2 hours</Text>
          </View>
        </TouchableOpacity>

        {/* Bundle Deal Card */}
        <TouchableOpacity style={styles.dealCard}>
          <View style={[styles.dealBadge, { backgroundColor: '#2ecc71' }]}>
            <Text style={styles.dealBadgeText}>BUNDLE</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' }}
            style={styles.dealImage}
          />
          <View style={styles.dealInfo}>
            <Text style={styles.dealTitle}>Buy 2 Get 1</Text>
            <Text style={styles.dealDescription}>Limited time offer</Text>
          </View>
        </TouchableOpacity>

        {/* Clearance Card */}
        <TouchableOpacity style={styles.dealCard}>
          <View style={[styles.dealBadge, { backgroundColor: '#f1c40f' }]}>
            <Text style={styles.dealBadgeText}>CLEARANCE</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad' }}
            style={styles.dealImage}
          />
          <View style={styles.dealInfo}>
            <Text style={styles.dealTitle}>End of Season</Text>
            <Text style={styles.dealDescription}>Up to 70% off</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderBrandsSection = (isLoading) => {
    if (isLoading) {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3, 4].map((item) => (
            <BrandSkeleton key={item} shimmerValue={shimmerValue} />
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.brandCircle}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?ixlib=rb-4.0.3' }}
            style={styles.brandLogo}
          />
          <Text style={styles.brandName}>Nike</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.brandCircle}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3' }}
            style={styles.brandLogo}
          />
          <Text style={styles.brandName}>Adidas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.brandCircle}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3' }}
            style={styles.brandLogo}
          />
          <Text style={styles.brandName}>Puma</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.brandCircle}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3' }}
            style={styles.brandLogo}
          />
          <Text style={styles.brandName}>Reebok</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderTrendingCategoriesGrid = () => (
    <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={[styles.sectionTitleAccent, {backgroundColor: '#FFD166'}]}></View>
          <Text style={styles.sectionTitle}>Trending Categories</Text>
        </View>
      </View>
      <View style={styles.gridContainer}>
        {/* First Row */}
        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'New Arrivals',
              filter: {
                sortBy: 'createdAt',
                sortOrder: 'desc',
                limit: 20
              }
            })}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>New</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Women',
              filter: {
                searchTerm: 'women',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?ixlib=rb-4.0.3' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Women</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Men',
              filter: {
                searchTerm: 'men',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1550246140-29f40b909e5a?ixlib=rb-4.0.3' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Men</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Asarion',
              filter: {
                searchTerm: 'asarion',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={require('../assets/images/Asarion2.png')} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Market</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Second Row */}
        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Shoes',
              filter: {
                searchTerm: 'shoes',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Shoes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Watches',
              filter: {
                searchTerm: 'watch',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-4.0.3' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Watches</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Bags',
              filter: {
                searchTerm: 'bag',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={{ uri: 'https://i.pinimg.com/474x/0b/8f/d9/0b8fd9d0b8f2006f2af7077c273a5375.jpg' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Bags</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('CategoriesScreen', { 
              categoryName: 'Crop Tops',
              filter: {
                searchTerm: 'crop top',
                sortBy: 'views',
                sortOrder: 'desc'
              }
            })}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?ixlib=rb-4.0.3' }} 
              style={styles.gridImage}
            />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridTitle}>Crop Tops</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5D3FD3" />
      <View style={styles.container}>
        {/* Header */}
        <Header
          location={location}
          refreshing={refreshing}
          isSeller={isSeller}
          onRefresh={handleRefresh}
          onNotificationPress={handleNotificationPress}
          onSellerDashboardPress={handleSellerDashboardPress}
          navigation={navigation}
        />
        
        {/* Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchTextChange={handleSearchTextChange}
          onSearchSubmit={handleSearch}
          onClearSearch={handleClearSearch}
          onFetchOriginalProducts={fetchOriginalProducts}
        />
        
        {/* Conditional Rendering: Show either search results or regular content */}
        {searchQuery.trim() ? (
          renderSearchResults()
        ) : (
                     <FlatList
             data={sectionsData}
             keyExtractor={keyExtractor}
             getItemLayout={getItemLayout}
             renderItem={renderSection}
             showsVerticalScrollIndicator={false}
             style={styles.scrollContent}
             refreshControl={
               <RefreshControl
                 refreshing={refreshing}
                 onRefresh={handleRefresh}
                 colors={['#5D3FD3']}
                 tintColor="#5D3FD3"
                 title="Pull to refresh"
                 titleColor="#5D3FD3"
               />
             }
             removeClippedSubviews={true}
             maxToRenderPerBatch={3}
             windowSize={7}
             initialNumToRender={4}
             updateCellsBatchingPeriod={100}
             scrollEventThrottle={16}
             bounces={true}
             contentContainerStyle={styles.flatListContent}
           />
        )}

        {/* Bottom Navigation */}
        <BottomNavigation
          navigation={navigation}
          cartItems={cartItems}
          favorites={favorites}
          currentScreen="BuyerHome"
        />
        
        {/* Full Screen Image Modal */}
        <Modal
          visible={fullScreenImage !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullScreenImage(null)}
        >
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFullScreenImage(null)}
            >
              <Ionicons name="close-circle" size={36} color="#fff" />
            </TouchableOpacity>
            {fullScreenImage && (
              <Image
                source={{ uri: fullScreenImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>

        {/* Notification Center */}
        <NotificationCenter 
          visible={showNotifications} 
          onClose={() => setShowNotifications(false)} 
          navigation={navigation}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5D3FD3',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
    marginBottom: 60,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  specialOffersContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  specialOffersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  specialOffersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
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
  gridContainer: {
    paddingHorizontal: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridItem: {
    width: (Dimensions.get('window').width - 56) / 4,
    height: (Dimensions.get('window').width - 56) / 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  gridTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dealsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  dealCard: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dealBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  dealBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dealImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  dealInfo: {
    padding: 16,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 14,
    color: '#666',
  },
  brandContainer: {
    marginBottom: 20,
  },
  brandCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  brandName: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 8,
  },
  searchResultsList: {
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  noResultsSubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF4757',
    fontSize: 16,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  recommendedGridContainer: {
    paddingHorizontal: 8,
  },
  recommendedRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendedGridItem: {
    width: (Dimensions.get('window').width - 30) / 2,
  },
});

export default BuyerHomeScreen;





