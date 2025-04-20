import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSelector, useDispatch } from 'react-redux';
import NotificationCenter from '../components/NotificationCenter';
import NotificationBadge from '../components/NotificationBadge';
import { handleAddToCartNotification } from '../services/notificationService';
import { requireAuthentication } from '../App'; // Import the authentication helper

// Mock data - replace with actual API calls
const FEATURED_PRODUCTS = [
  {
    _id: '1',
    name: 'Premium Headphones',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.8,
  },
  {
    _id: '2',
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.5,
  },
  {
    _id: '3',
    name: 'Wireless Earbuds',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.7,
  },
  {
    _id: '4',
    name: 'Bluetooth Speaker',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.6,
  },
];

const CATEGORIES = [
  { id: '1', name: 'Electronic', icon: 'devices', color: '#FF6B6B' },
  { id: '2', name: 'Fashion', icon: 'checkroom', color: '#4ECDC4' },
  { id: '3', name: 'Home', icon: 'home', color: '#FFD166' },
  { id: '4', name: 'Beauty', icon: 'spa', color: '#FF9F9F' },
  { id: '5', name: 'Sneakers', icon: 'sports-basketball', color: '#6A0572' },
  { id: '6', name: 'Books', icon: 'menu-book', color: '#1A535C' },
];

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

let url = 'http://172.20.10.3:5000/api/products';

const BuyerHomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('User');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [services, setServices] = useState([]);
  const [specialOffers, setSpecialOffers] = useState(SPECIAL_OFFERS);
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const specialOffersScrollViewRef = useRef(null);
  const [location, setLocation] = useState('Loading location...');
  const [locationPermission, setLocationPermission] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Get cart items from Redux store
  const { items: cartItems } = useSelector(state => state.cart);
  const dispatch = useDispatch();

  // Location detection useEffect
  useEffect(() => {
    const getLocation = async () => {
      try {
        // Check if expo-location is available
        if (!Location) {
          console.log('Expo Location is not available');
          setLocation('UCC, Capecoast'); // Fallback location
          return;
        }
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          setLocation('New York, USA'); // Fallback location
          setLocationPermission(false);
          return;
        }
        
        setLocationPermission(true);
        
        // Get current position
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        if (position) {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get the address
          const geocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          if (geocode && geocode.length > 0) {
            const address = geocode[0];
            const locationString = address.city ? 
              `${address.city}, ${address.country}` : 
              address.region ? 
                `${address.region}, ${address.country}` : 
                `${address.country}`;
                
            console.log('Location detected:', locationString);
            setLocation(locationString);
          } else {
            setLocation('New York, USA'); // Fallback location
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocation('New York, USA'); // Fallback location
      }
    };
    
    getLocation();
  }, []);

  // Add new useEffect to fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://172.20.10.3:5000/api/products');
        console.log('Products API Response Status:', response.status);
        
        if (response.ok) {
          const products = await response.json();
          console.log('Fetched products:', products);
          // Filter out products that have isService set to true
          const nonServiceProducts = products.filter(product => product.isService !== true);
          setFeaturedProducts(nonServiceProducts);
        } else {
          console.log('Using mock data due to API failure');
          setFeaturedProducts(FEATURED_PRODUCTS);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        console.log('Using mock data due to error');
        setFeaturedProducts(FEATURED_PRODUCTS);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          console.log('Token found:', token.substring(0, 10) + '...');
          
          const response = await fetch('http://172.20.10.3:5000/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('User data response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('User data received:', userData);
            setUserName(userData.username || userData.name || userData.firstName || 'User');
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch user data. Status:', response.status, 'Error:', errorText);
            setUserName('User');
          }
        } else {
          console.log('No user token found');
          setUserName('Guest');
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        setUserName('User');
      }
    };

    getUserData();
  }, []);

  // Update the useEffect for services to filter products instead of making a new API call
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://172.20.10.3:5000/api/products');
        console.log('Products API Response Status:', response.status);
        
        if (response.ok) {
          const products = await response.json();
          // Filter products to get services using isService field OR featuredType field
          const serviceProducts = products.filter(product => 
            product.isService === true || product.featuredType === 'featured-service'
          );
          console.log('Filtered services:', serviceProducts);
          setServices(serviceProducts);
        } else {
          console.log('Failed to fetch services');
          setServices([]); // Set empty array if fetch fails
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]); // Set empty array on error
      }
    };

    fetchServices();
  }, []);

  // Add a useEffect for the auto-scrolling carousel functionality
  useEffect(() => {
    let interval;
    
    // Start auto-scrolling when component mounts
    const startAutoScroll = () => {
      interval = setInterval(() => {
        if (specialOffersScrollViewRef.current) {
          const nextIndex = (activeOfferIndex + 1) % specialOffers.length;
          const slideWidth = 280 + 15; // card width + margin
          
          specialOffersScrollViewRef.current.scrollTo({
            x: nextIndex * slideWidth,
            animated: true,
          });
          
          setActiveOfferIndex(nextIndex);
        }
      }, 3000); // Auto-scroll every 3 seconds
    };
    
    startAutoScroll();
    
    // Clean up interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeOfferIndex, specialOffers.length]);

  // Add new useEffect to load favorites from AsyncStorage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
          console.log('Loaded favorites from storage:', JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  // Function to toggle favorite status
  const toggleFavorite = async (productId) => {
    // Check if user is authenticated
    if (!requireAuthentication(navigation, 'add to favorites')) {
      return;
    }
    
    try {
      let newFavorites;
      if (favorites.includes(productId)) {
        // Remove from favorites
        newFavorites = favorites.filter(id => id !== productId);
      } else {
        // Add to favorites
        newFavorites = [...favorites, productId];
      }

      // Update state
      setFavorites(newFavorites);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      console.log('Favorites updated:', newFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const handleAddToCart = async (product) => {
    // Check if user is authenticated
    if (!requireAuthentication(navigation, 'add items to cart')) {
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Token is guaranteed to exist at this point because of requireAuthentication
      
      // Make API call to add to cart
      const response = await fetch(`${url}/api/cart/add`, {
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

  const renderFeaturedProduct = ({ item }) => {
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `http://172.20.10.3:5000${item.image}`);
    
    // Check if this product is in favorites
    const isFavorite = favorites.includes(item._id);
    
    // Log product details for debugging
    console.log('Product:', item.name);
    console.log('Product ID:', item._id);
    console.log('Stock:', item.countInStock);
    console.log('Is New:', item.isNew);
    console.log('Is Service:', item.isService);
    console.log('Is Favorite:', isFavorite);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          console.log('Navigating to product details with ID:', item._id);
          navigation.navigate('ProductDetails', { 
            productId: item._id
          });
        }}
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
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onPress
              toggleFavorite(item._id);
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
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= 4 ? "star" : "star-outline"} 
                    size={14} 
                    color="#FFD700" 
                  />
                ))}
              </View>
            </View>
          </View>
          <View style={styles.productFooter}>
            <View style={styles.sellerInfo}>
              <Ionicons name="car-outline" size={12} color="#666" />
              <Text style={styles.sellerText}>15% off delivery</Text>
            </View>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Ionicons name="add-circle" size={20} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('CategoriesScreen', { 
        categoryId: item.id,
        categoryName: item.name 
      })}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}20` }]}>
        <MaterialIcons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Add new render function specifically for services
  const renderService = ({ item }) => {
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `http://172.20.10.3:5000${item.image}`);

    // Check if this service is in favorites
    const isFavorite = favorites.includes(item._id);

    console.log('Service:', item.name);
    console.log('Service ID:', item._id);
    console.log('Original image path:', item.image);
    console.log('Constructed image URI:', imageUri);
    console.log('Is Favorite:', isFavorite);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          console.log('Navigating to product details with ID:', item._id);
          navigation.navigate('ProductDetails', { 
            productId: item._id
          });
        }}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
            onLoad={() => console.log('Image loaded successfully:', imageUri)}
          />
          <View style={[styles.productBadge, { backgroundColor: '#4ECDC4' }]}>
            <Text style={styles.productBadgeText}>Service</Text>
          </View>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onPress
              toggleFavorite(item._id);
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
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name={star <= 4 ? "star" : "star-outline"} 
                      size={14} 
                      color="#FFD700" 
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
          <View style={styles.productFooter}>
            <View style={styles.sellerInfo}>
              <Ionicons name="time-outline" size={12} color="#666" />
              <Text style={styles.sellerText}>Available Now</Text>
            </View>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Ionicons name="add-circle" size={20} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header with extra padding for Android */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.brandNameContainer}>
              <Text style={[styles.greeting, {color: '#fff'}]}>Uni</Text>
              <Text style={[styles.greeting, {color: '#FF4757'}]}>Market</Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.locationText}>{location}</Text>
              {location === 'Loading location...' ? (
                <Ionicons name="sync" size={14} color="#fff" style={{marginLeft: 4, opacity: 0.8}} />
              ) : (
                <TouchableOpacity 
                  onPress={() => {
                    setLocation('Loading location...');
                    // Re-fetch location
                    const getLocation = async () => {
                      try {
                        if (!Location) {
                          setLocation('UCC, Capecoast');
                          return;
                        }
                        
                        const position = await Location.getCurrentPositionAsync({
                          accuracy: Location.Accuracy.Balanced,
                        });
                        
                        if (position) {
                          const { latitude, longitude } = position.coords;
                          const geocode = await Location.reverseGeocodeAsync({
                            latitude,
                            longitude
                          });
                          
                          if (geocode && geocode.length > 0) {
                            const address = geocode[0];
                            const locationString = address.city ? 
                              `${address.city}, ${address.country}` : 
                              address.region ? 
                                `${address.region}, ${address.country}` : 
                                `${address.country}`;
                            
                            setLocation(locationString);
                          } else {
                            setLocation('New York, USA');
                          }
                        }
                      } catch (error) {
                        console.error('Error refreshing location:', error);
                        setLocation('New York, USA');
                      }
                    };
                    
                    getLocation();
                  }}
                >
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <NotificationBadge style={styles.headerNotificationBadge} />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="options-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
          {/* Special Offers Section - Added based on image reference */}
          <View style={styles.specialOffersContainer}>
            <View style={styles.specialOffersHeader}>
              <Text style={styles.specialOffersTitle}>#SpecialForYou</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={specialOffersScrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              onMomentumScrollEnd={(event) => {
                const slideWidth = 280 + 15; // card width + margin
                const offsetX = event.nativeEvent.contentOffset.x;
                const activeIndex = Math.round(offsetX / slideWidth);
                setActiveOfferIndex(activeIndex);
              }}
            >
              {specialOffers.map((offer) => (
                <TouchableOpacity key={offer.id} style={styles.specialOfferCard}>
                  <Image 
                    source={{ uri: offer.backgroundImage }}
                    style={styles.offerBackgroundImage}
                  />
                  <View style={styles.offerContentWrapper}>
                    <View style={styles.offerImageContainer}>
                      <Image 
                        source={{ uri: offer.productImage }}
                        style={styles.offerImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.offerContent}>
                      <Text style={styles.offerHeading}>{offer.title}</Text>
                      <Text style={styles.offerDiscount}>{offer.discount}</Text>
                      <Text style={styles.offerDetails}>{offer.details}</Text>
                      <TouchableOpacity style={[styles.offerButton, { backgroundColor: offer.buttonColor }]}>
                        <Text style={styles.offerButtonText}>{offer.buttonText}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Pagination Dots */}
            <View style={styles.paginationDotsContainer}>
              {specialOffers.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeOfferIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* Categories */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CategoriesScreen')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
          
          {/* Featured Products */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleAccent}></View>
                <Text style={styles.sectionTitle}>Featured Products</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton} 
                onPress={() => navigation.navigate('CategoriesScreen', { featuredOnly: true })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => item._id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
          
          {/* New Arrivals */}
          <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionTitleAccent, {backgroundColor: '#5D3FD3'}]}></View>
                <Text style={styles.sectionTitle}>New Arrivals</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton} 
                onPress={() => navigation.navigate('CategoriesScreen', { newArrivals: true })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProducts.slice(-3)}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => item._id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>

          {/* Services */}
          <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionTitleAccent, {backgroundColor: '#4ECDC4'}]}></View>
                <Text style={styles.sectionTitle}>Services</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton} 
                onPress={() => navigation.navigate('CategoriesScreen', { services: true })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={services}
              renderItem={renderService}
              keyExtractor={(item) => item._id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
              ListEmptyComponent={() => (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>No services available</Text>
                </View>
              )}
            />
          </View>

          {/* Trending Categories Grid */}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'New', categoryId: 'new' })}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Women', categoryId: 'women' })}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Men', categoryId: 'men' })}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Asarion', categoryId: 'Asarion' })}
                >
                  <Image 
                    source={require('../assets/images/Asarion2.png')} 
                    style={styles.gridImage}
                  />
                  <View style={styles.gridOverlay}>
                    <Text style={styles.gridTitle}>Asarion</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Second Row */}
              <View style={styles.gridRow}>
                <TouchableOpacity 
                  style={styles.gridItem}
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Shoes', categoryId: 'shoes' })}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Watches', categoryId: 'watches' })}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Bags', categoryId: 'bags' })}
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Crop Tops', categoryId: 'crop-tops' })}
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

          {/* After Trending Categories Grid, add: */}
          <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionTitleAccent, {backgroundColor: '#5D3FD3'}]}></View>
                <Text style={styles.sectionTitle}>Special Offers & Deals</Text>
              </View>
            </View>
            
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
          </View>

          {/* Featured Brands */}
          <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionTitleAccent, {backgroundColor: '#6c5ce7'}]}></View>
                <Text style={styles.sectionTitle}>Featured Brands</Text>
              </View>
            </View>

            {/* Brand Logos */}
            <View style={styles.brandContainer}>
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
            </View>

            {/* Special Collections */}
            <View style={styles.collectionsContainer}>
              <TouchableOpacity style={styles.collectionCard}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?ixlib=rb-4.0.3' }}
                    style={styles.collectionImage}
                />
                <View style={styles.collectionOverlay}>
                  <Text style={styles.collectionTitle}>Premium Collection</Text>
                  <Text style={styles.collectionSubtitle}>Luxury at its finest</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.collectionCard}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3' }}
                    style={styles.collectionImage}
                />
                <View style={styles.collectionOverlay}>
                  <Text style={styles.collectionTitle}>New Season</Text>
                  <Text style={styles.collectionSubtitle}>Spring/Summer 2024</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('BuyerHome')}
          >
            <Ionicons name="home" size={22} color="#5D3FD3" />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Categories')}
          >
            <Ionicons name="grid-outline" size={22} color="#999" />
            <Text style={styles.navText}>Categories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.centerButtonInner}>
              <Ionicons name="cart" size={24} color="#fff" />
              {cartItems && cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Favorites')}
          >
            <Ionicons 
              name={favorites.length > 0 ? "heart" : "heart-outline"} 
              size={22} 
              color={favorites.length > 0 ? "#FF4757" : "#999"} 
            />
            <Text style={styles.navText}>Favorites</Text>
            {favorites.length > 0 && (
              <View style={styles.favoriteBadge}>
                <Text style={styles.favoriteBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={22} color="#999" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
        
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
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 16 : 20,
    paddingTop: Platform.OS === 'android' ? 20: 24,
    backgroundColor: '#5D3FD3',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: Platform.OS === 'android' ? 100 : 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // Changed to white to show on red background
  },
  brandNameContainer: {
    flexDirection: 'row',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff', // Changed to white to show on red background
    marginTop: 2,
    opacity: 0.9,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Translucent white
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: -20, // Overlapping with the header
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // Shadow for the search bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 16,
    color: '#333',
  },
  
  /* Special Offers Section - Added based on image reference */
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
  seeAllLink: {
    fontSize: 14,
    color: '#3498db',
  },
  specialOfferCard: {
    width: 280,
    height: 160,
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  offerContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    position: 'relative',
    zIndex: 1,
  },
  offerImageContainer: {
    width: 100,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  offerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  offerHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  offerDiscount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  offerDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  offerButton: {
    backgroundColor: '#f9004d',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 50,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
  },
  productsList: {
    paddingHorizontal: 12,
  },
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
    fontWeight: '500',
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
  addToCartButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
    marginBottom: 60, // Add space for the bottom navigation
  },
  bottomNavigation: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9e9e9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 999,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#999',
  },
  activeNavText: {
    color: '#5D3FD3',
    fontWeight: 'bold',
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
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
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
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
  collectionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  collectionCard: {
    width: (Dimensions.get('window').width - 48) / 2,
    height: 150,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
  
    elevation: 4,
  },
  collectionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  collectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  serviceLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  centerButton: {
    top: -30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#5D3FD3',
    width: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    marginRight: 4,
    opacity: 0.9,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  favoriteBadge: {
    position: 'absolute',
    top: -2,
    right: 10,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  favoriteBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  headerNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -5,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 10,
  },
});

export default BuyerHomeScreen;





