import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data - replace with actual API calls
const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'Premium Headphones',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.5,
  },
  {
    id: '3',
    name: 'Wireless Earbuds',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.7,
  },
  {
    id: '4',
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
  { id: '5', name: 'Sports', icon: 'sports-basketball', color: '#6A0572' },
  { id: '6', name: 'Books', icon: 'menu-book', color: '#1A535C' },
];

const BuyerHomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('User');

  // Add new useEffect to fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://172.20.10.3:5000/api/products');
        if (response.ok) {
          const products = await response.json();
          setFeaturedProducts(products);
        } else {
          // Fallback to mock data if API fails
          setFeaturedProducts(FEATURED_PRODUCTS);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock data if API fails
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
            setUserName(userData.username || userData.name || 'User');
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const renderFeaturedProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => {
        console.log('Navigating to product details with ID:', item._id || item.id);
        navigation.navigate('ProductDetails', { 
          productId: item._id || item.id // Use _id if available (MongoDB format), otherwise fall back to id
        });
      }}
    >
      <Image 
        source={{ 
          uri: item.image && item.image.startsWith('http') 
            ? item.image 
            : `http://172.20.10.3:5000/${item.image}` 
        }} 
        style={styles.productImage}
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

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('CategoryProducts', { categoryId: item.id })}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}20` }]}>
        <MaterialIcons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

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
            <Ionicons name="notifications-outline" size={24} color="#666" />
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
          {/* Banner */}
          <View style={styles.bannerContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80' }} 
              style={styles.banner}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>Special Offers</Text>
              <Text style={styles.bannerSubtitle}>Up to 50% off</Text>
              <TouchableOpacity style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Categories */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
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
                onPress={() => navigation.navigate('AllProducts')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => item.id}
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
                onPress={() => navigation.navigate('NewArrivals')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#5D3FD3" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProducts.slice(-3)}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => `new-${item._id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
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
    paddingVertical: 16, // Increased padding
    backgroundColor: '#fff',
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
  seeAllText: {
    fontSize: 14,
    color: '#5D3FD3',
    fontWeight: '500',
    marginRight: 2,
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
});

export default BuyerHomeScreen;
