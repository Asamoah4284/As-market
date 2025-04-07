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
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  { id: '1', name: 'Electronics', icon: 'devices', color: '#FF6B6B' },
  { id: '2', name: 'Fashion', icon: 'checkroom', color: '#4ECDC4' },
  { id: '3', name: 'Home', icon: 'home', color: '#FFD166' },
  { id: '4', name: 'Beauty', icon: 'spa', color: '#FF9F9F' },
  { id: '5', name: 'Sneakers', icon: 'sports-basketball', color: '#6A0572' },
  { id: '6', name: 'Books', icon: 'menu-book', color: '#1A535C' },
];

const BANNER_DATA = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    title: 'Special Offers',
    subtitle: 'Up to 50% off',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    title: 'New Arrivals',
    subtitle: 'Check out the latest',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80',
    title: 'Flash Sale',
    subtitle: 'Limited time deals',
  },
];

let url = 'http://172.20.10.3:5000/api/products';

const BuyerHomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('User');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const flatListRef = useRef(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % BANNER_DATA.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
      setCurrentBannerIndex(nextIndex);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentBannerIndex]);

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

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const renderFeaturedProduct = ({ item }) => {
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `http://172.20.10.3:5000${item.image}`);
    
    console.log('Product:', item.name);
    console.log('Product ID:', item._id);
    console.log('Original image path:', item.image);
    console.log('Constructed image URI:', imageUri);

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
       
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
            onLoad={() => console.log('Image loaded successfully:', imageUri)}
          />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.productDetails}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
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

    console.log('Service:', item.name);
    console.log('Service ID:', item._id);
    console.log('Original image path:', item.image);
    console.log('Constructed image URI:', imageUri);

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
        <Image 
          source={{ uri: item.image }} 
          style={styles.productImage}
          onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          onLoad={() => console.log('Image loaded successfully:', imageUri)}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.productDetails}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hello, {userName}!</Text>
            <Text style={styles.subtitle}>Find amazing products</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFD166" />
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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
          {/* Banner Carousel */}
          <View style={styles.bannerContainer}>
            <FlatList
              ref={flatListRef}
              data={BANNER_DATA}
              renderItem={({ item }) => (
                <View style={styles.bannerSlide}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.banner}
                    resizeMode="cover"
                  />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                    <TouchableOpacity style={styles.bannerButton}>
                      <Text style={styles.bannerButtonText}>Shop Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / 
                  (Dimensions.get('window').width - 32)
                );
                setCurrentBannerIndex(newIndex);
              }}
              getItemLayout={(data, index) => ({
                length: Dimensions.get('window').width - 32,
                offset: (Dimensions.get('window').width - 32) * index,
                index,
              })}
            />
            <View style={styles.paginationDots}>
              {BANNER_DATA.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: index === currentBannerIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
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
                <View style={[styles.sectionTitleAccent, {backgroundColor: '#FF6B6B'}]}></View>
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
                  onPress={() => navigation.navigate('CategoriesScreen', { categoryName: 'Kids', categoryId: 'kids' })}
                >
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?ixlib=rb-4.0.3' }} 
                    style={styles.gridImage}
                  />
                  <View style={styles.gridOverlay}>
                    <Text style={styles.gridTitle}>Kids</Text>
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
                    source={{ uri: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3' }} 
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
                <View style={[styles.sectionTitleAccent, {backgroundColor: '#FF4757'}]}></View>
                <Text style={styles.sectionTitle}>Special Offers & Deals</Text>
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsContainer}>
              {/* Flash Sale Card */}
              <TouchableOpacity style={styles.dealCard}>
                <View style={[styles.dealBadge, { backgroundColor: '#FF4757' }]}>
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
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home" size={24} color="#5D3FD3" />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Categories')}
          >
            <Ionicons name="grid-outline" size={24} color="#999" />
            <Text style={styles.navText}>Categories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart-outline" size={24} color="#999" />
            <Text style={styles.navText}>Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={24} color="#999" />
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight || 0, // Add padding for Android StatusBar
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  bannerContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    height: 160,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
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
    marginHorizontal: 8,
    width: 80,
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
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  productsList: {
    paddingHorizontal: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
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
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
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
  bannerSlide: {
    width: Dimensions.get('window').width - 32, // Adjust based on your margins
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
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
    width: '22%',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 2,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
  },
  gridTitle: {
    color: '#fff',
    fontSize: 12, // Reduced font size to fit smaller boxes
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
    width: 200,
    height: 250,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    height: 160,
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
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  brandCircle: {
    alignItems: 'center',
    marginRight: 20,
  },
  brandLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  brandName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  collectionsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectionCard: {
    width: '48%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  collectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  collectionSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
});

export default BuyerHomeScreen;




