import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { handleNewProductNotification } from '../services/notificationService';
import { API_BASE_URL } from '../config/api';

const SellerDashboardScreen = () => {
  const navigation = useNavigation();
  const theme = {
    primary: '#5D3FD3',
    primaryDark: '#3730A3',
    secondary: '#6c757d',
    success: '#2EC4B6',
    danger: '#E63946',
    warning: '#FF9F1C',
    background: '#F8FAFC',
    cardBackground: '#ffffff',
    text: '#1A1B25',
    textSecondary: '#64748B',
    inputBackground: '#f1f3f5',
    border: '#E2E8F0',
    highlight: '#F0F4FF',
  };

  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    image: 'https://via.placeholder.com/150',
    additionalImages: [],
    isService: false,
    status: 'pending',
    gender: '',
    color: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showStatusGuide, setShowStatusGuide] = useState(true);
  const [categories, setCategories] = useState({
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
  });
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    joinDate: '',
    totalSales: 0,
    rating: 0,
    avatar: null
  });
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatar: null
  });
  const [refreshing, setRefreshing] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const ORDERS_PER_PAGE = 10;
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const promoteIconScale = new Animated.Value(1);
  const promoteIconRotate = new Animated.Value(0);
  const ordersIconScale = new Animated.Value(1);

  const isTokenExpired = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const { exp } = JSON.parse(jsonPayload);
      const expired = Date.now() >= exp * 1000;
      
      console.log('Token expiration:', new Date(exp * 1000));
      console.log('Token expired:', expired);
      
      return expired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't verify
    }
  };

  // Add this check before making API calls
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        if (isTokenExpired(token)) {
          console.log('Token is expired, logging out...');
          await AsyncStorage.removeItem('userToken');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    
    checkAuthStatus();
  }, []);

  useEffect(() => {
    fetchData();
    fetchProfileData();
  }, []);

  // Add timer to hide status guide after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStatusGuide(false);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  // Add useEffect for orders
  useEffect(() => {
    if (activeTab === 'orders') {
      console.log('Orders tab activated, fetching orders...');
      fetchOrders(1, true);
    }
  }, [activeTab]);

  const fetchOrders = async (page = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
        setOrderPage(1);
        setHasMoreOrders(true);
      }
      
      if (!hasMoreOrders && !shouldRefresh) return;
      
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching orders for seller...');
      const url = `${API_BASE_URL}/api/orders/seller/me?page=${page}&limit=${ORDERS_PER_PAGE}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Check if we have more orders to load
      const orders = data.orders || [];
      console.log('Number of orders received:', orders.length);
      
      setHasMoreOrders(orders.length === ORDERS_PER_PAGE);
      
      // Update orders state based on whether we're refreshing or loading more
      if (shouldRefresh || page === 1) {
        console.log('Setting initial orders:', orders);
        setOrders(orders);
      } else {
        console.log('Appending orders to existing list');
        setOrders(prevOrders => [...prevOrders, ...orders]);
      }
      
      setOrderPage(page);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert(
        'Error',
        'Unable to load orders. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => fetchOrders(1, true)
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMoreOrders = () => {
    if (!loading && hasMoreOrders) {
      fetchOrders(orderPage + 1);
    }
  };

  const handleRefreshOrders = () => {
    fetchOrders(1, true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchProfileData(),
        fetchOrders() // Add orders to initial fetch
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const requestUrl = `${API_BASE_URL}/api/products/seller`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Ensure each product has views and sort by creation date
      const productsWithViews = data.map(product => ({
        ...product,
        views: product.views || 0,
        createdAt: product.createdAt || new Date().toISOString()
      }));

      // Sort products by creation date (newest first)
      const sortedProducts = productsWithViews.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Detailed fetch error:', error);
      setProducts([]);
      setErrorMessage(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const mockFetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/seller`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched orders:', data);
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  };

  const mockFetchChats = () => {
    return Promise.resolve([
      { id: '1', customer: 'John Doe', lastMessage: 'Is this product still available?', timestamp: '10:30 AM', unread: 2 },
      { id: '2', customer: 'Jane Smith', lastMessage: 'Thanks for the quick delivery!', timestamp: 'Yesterday', unread: 0 },
      { id: '3', customer: 'Bob Johnson', lastMessage: 'When will my order ship?', timestamp: 'May 13', unread: 1 },
    ]);
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
    
      
      const response = await fetch(`${API_BASE_URL}/api/seller/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      // console.error('Error fetching profile data:', error); 
      // Use mock data as fallback
      setProfileData({
        name: 'John Seller',
        email: 'john.seller@example.com',
        phone: '+233 XX XXX XXXX',
        bio: 'Passionate seller offering quality products to the campus community.',
        location: 'Campus Area',
        joinDate: 'May 2023',
        totalSales: 152,
        rating: 4.8,
        avatar: null,
        followers: 87,
        isPremium: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(false);
    setProductForm({
      name: '',
      price: '',
      description: '',
      category: '',
      stock: '',
      image: 'https://via.placeholder.com/150',
      additionalImages: [],
      isService: false,
      status: 'pending',
      gender: '',
      color: '',
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    // Prevent editing approved products
    if (product.status === 'approved') {
      Alert.alert(
        'Cannot Edit Approved Product',
        'This product has been approved and is live on the marketplace. To make changes, you would need to create a new product.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // For rejected products, show rejection reason in an alert first
    if (product.status === 'rejected' && product.rejectionReason) {
      Alert.alert(
        'Product Rejected',
        `Your product was rejected for the following reason:\n\n${product.rejectionReason}\n\nYou can edit and resubmit your product.`,
        [{ text: 'Edit Product', style: 'default', onPress: () => proceedToEdit(product) }]
      );
      return;
    }

    // If not rejected or no rejection reason, proceed to edit directly
    proceedToEdit(product);
  };

  // Helper function to set up the edit form
  const proceedToEdit = (product) => {
    setIsEditing(true);
    setCurrentProductId(product._id);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      stock: product.stock.toString(),
      image: product.image,
      additionalImages: product.additionalImages || [],
      isService: product.isService || false,
      rejectionReason: product.rejectionReason || null, // Store rejection reason if it exists
      gender: product.gender || '',
      color: product.color || '',
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('userToken'); // Changed from 'token' to 'userToken'
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      // Update local state after successful deletion
      setProducts(products.filter(product => product._id !== productId));
      setSuccessMessage('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Failed to delete product');
      // Fallback to local state update if API call fails - use _id instead of id
      setProducts(products.filter(product => product._id !== productId));
    }
  };

  const handleSaveProduct = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setLoading(true);
      
      // Validate form inputs
      if (!productForm.name || !productForm.price || !productForm.description || !productForm.category) {
        setErrorMessage('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Add validation for gender and color if it's a product (not a service)
      if (!productForm.isService) {
        if (!productForm.gender) {
          setErrorMessage('Please select a gender for the product');
          setLoading(false);
          return;
        }
        if (!productForm.color) {
          setErrorMessage('Please enter a color for the product');
          setLoading(false);
          return;
        }
      }
      
      // Validate image
      if (!productForm.image) {
        setErrorMessage('Please select a main product image');
        setLoading(false);
        return;
      }
      
      // For services, stock might not be required
      if (!productForm.isService && !productForm.stock) {
        setErrorMessage('Please enter stock quantity for product');
        setLoading(false);
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        // throw new Error('Authentication required');
      }
      
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: productForm.isService ? 1 : parseInt(productForm.stock),
        image: productForm.image,
        additionalImages: productForm.additionalImages.filter(img => img),
        isService: productForm.isService,
        status: 'pending', // Always set status to pending for new/edited products
        rejectionReason: null, // Clear any previous rejection reason
        gender: productForm.gender,
        color: productForm.color,
      };
      
      // Use the same base URL as fetch products
      const baseUrl = `${API_BASE_URL}`;
      const url = isEditing 
        ? `${baseUrl}/api/products/${currentProductId}`
        : `${baseUrl}/api/products`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }
      
      const savedProduct = await response.json();
      
      // Send notification for new product (not for edits)
      if (!isEditing) {
        // Get seller name from profile data
        const sellerName = profileData.name || 'A seller';
        handleNewProductNotification(productData.name, sellerName);

        // Add new product to the top of the list
        setProducts(prevProducts => [
          {
            ...savedProduct,
            views: 0,
            createdAt: new Date().toISOString()
          },
          ...prevProducts
        ]);
      } else {
        // Update existing product in the list
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === currentProductId ? { ...savedProduct, views: product.views || 0 } : product
          )
        );
      }
      
      setSuccessMessage(isEditing 
        ? 'Product updated successfully! It will be reviewed by admin.' 
        : 'Product added successfully! It will be reviewed by admin.'
      );
      
      // Close modal after delay to allow user to see success message
      setTimeout(() => {
        setModalVisible(false);
        fetchProducts(); // Refresh the products list
      }, 1500);
      
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      // Verify API URL
      if (!API_BASE_URL) {
        throw new Error('API URL is not configured');
      }

      // Use the correct endpoint
      const apiUrl = `${API_BASE_URL}/api/orders/${orderId}`;
      console.log('Making request to:', apiUrl);

      // Make the update request
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus
        })
      });

      // Log response details for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error('Failed to parse response:', e);
        console.error('Response text:', responseText);
        throw new Error('Server returned invalid response format');
      }

      if (!response.ok) {
        throw new Error(data?.message || `Server error: ${response.status}`);
      }

      // If successful, update the UI
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );

      // Show success message
      Alert.alert(
        'Success', 
        `Order status updated to ${newStatus === 'processing' ? 'Processing' : 'Completed'}`,
        [{ text: 'OK' }]
      );

      // Refresh orders to ensure we have the latest data
      await fetchOrders(1, true);

    } catch (error) {
      console.error('Error updating order status:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        apiUrl: API_BASE_URL
      });
      
      // Revert any optimistic updates
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: order.orderStatus }
            : order
        )
      );

      // Show appropriate error message
      let errorMessage = 'Failed to update order status. ';
      if (error.message.includes('Cannot connect to the server')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('invalid response format')) {
        errorMessage += 'Server returned an invalid response. Please try again later.';
      } else {
        errorMessage += 'Please try again.';
      }

      Alert.alert(
        'Error', 
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => handleUpdateOrderStatus(orderId, newStatus)
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }) => {
    console.log(item);
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.productImageContainer}>
          <Image source={{ uri: item.image }} style={styles.productImage} />
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>{item.category}</Text>
          </View>
          
          {/* Display appropriate badge based on product status */}
          {item.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Approval</Text>
            </View>
          )}
          {item.status === 'approved' && (
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>Approved</Text>
            </View>
          )}
          {item.status === 'rejected' && (
            <View style={styles.rejectedBadge}>
              <Text style={styles.rejectedText}>Rejected (Click Edit)</Text>
            </View>
          )}
          
          {/* Only show low stock badge for approved products */}
          {item.stock < 5 && item.status === 'approved' && !item.isService && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.productMetrics}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                GH₵{item.sellerPrice ? item.sellerPrice.toFixed(2) : item.price.toFixed(2)}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Price</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {item.isService ? 'Yes' : item.stock}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {item.isService ? 'Availability' : 'In Stock'}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.success }]}>{item.views || 0}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                {item.isService ? 'Profile Views' : 'Product Views'}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{item.rating || 0}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome 
                  key={star}
                  name={star <= Math.floor(item.rating || 0) ? "star" : star <= (item.rating || 0) ? "star-half-o" : "star-o"} 
                  size={14} 
                  color={theme.warning} 
                  style={styles.starIcon}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.productActions}>
          {/* Only allow editing if product is not approved yet */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton, { backgroundColor: theme.highlight }]}
            onPress={() => handleEditProduct(item)}
            disabled={item.status === 'approved'}
          >
            <MaterialIcons 
              name="edit" 
              size={18} 
              color={item.status === 'approved' ? theme.textSecondary : theme.primary} 
            />
            <Text style={[styles.actionButtonText, { color: item.status === 'approved' ? theme.textSecondary : theme.primary }]}>
              {item.status === 'approved' 
                ? 'Approved' 
                : (item.status === 'rejected' ? 'View Reason' : 'Edit')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.danger + '15' }]}
            onPress={() => handleDeleteProduct(item._id)}
          >
            <MaterialIcons name="delete" size={18} color={theme.danger} />
            <Text style={[styles.actionButtonText, { color: theme.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getOrderStatusInfo = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          icon: 'schedule',
          color: '#FF9F1C',
          bg: '#FFF3CD',
          text: 'Awaiting Confirmation'
        };
      case 'processing':
        return {
          icon: 'local-shipping',
          color: '#4361EE',
          bg: '#E8F0FE',
          text: 'Processing Order'
        };
      case 'completed':
        return {
          icon: 'check-circle',
          color: '#2EC4B6',
          bg: '#E8F5E9',
          text: 'Order Completed'
        };
      case 'delivered':
        return {
          icon: 'local-shipping',
          color: '#2EC4B6',
          bg: '#E8F5E9',
          text: 'Delivered Successfully'
        };
      case 'cancelled':
        return {
          icon: 'cancel',
          color: '#E63946',
          bg: '#FFEBEE',
          text: 'Order Cancelled'
        };
      default:
        return {
          icon: 'info',
          color: '#6c757d',
          bg: '#F8F9FA',
          text: status
        };
    }
  };

  const renderOrderItem = ({ item }) => {
    if (!item) return null;

    const orderDate = new Date(item.createdAt);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusInfo = getOrderStatusInfo(item.orderStatus || 'pending');

    return (
      <View style={[styles.orderCard, { backgroundColor: theme.cardBackground }]}>
        {/* Order Header with Enhanced Gradient */}
        <LinearGradient
          colors={['rgba(93, 63, 211, 0.08)', 'rgba(93, 63, 211, 0.02)']}
          style={styles.orderHeaderGradient}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <View style={styles.orderIdContainer}>
                <View style={[styles.orderIconContainer, { backgroundColor: theme.primary + '15' }]}>
                  <MaterialIcons name="receipt" size={18} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.orderId, { color: theme.text }]}>
                    Order #{item._id?.slice(-6) || 'N/A'}
                  </Text>
                  <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
                    {formattedDate}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusContainer, { backgroundColor: statusInfo.bg }]}>
              <MaterialIcons 
                name={statusInfo.icon} 
                size={18} 
                color={statusInfo.color} 
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Order Summary Section */}
        <View style={styles.orderSummarySection}>
          <View style={styles.orderSummaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="shopping-bag" size={20} color={theme.textSecondary} />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Items</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {item.items?.length || 0}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialIcons name="payments" size={20} color={theme.textSecondary} />
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total</Text>
              <Text style={[styles.summaryValue, { color: theme.primary, fontWeight: '700' }]}>
                GH₵{item.totalAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items Section */}
        <View style={styles.orderItemsContainer}>
          <View style={styles.orderItemsHeader}>
            <MaterialIcons name="inventory" size={20} color={theme.text} />
            <Text style={[styles.orderItemsTitle, { color: theme.text }]}>Order Items</Text>
          </View>
          {(item.items || []).map((orderItem, index) => (
            <View key={index} style={styles.orderItem}>
              <Image 
                source={{ 
                  uri: orderItem.image || 'https://via.placeholder.com/50',
                  cache: 'reload'
                }} 
                style={styles.orderItemImage}
              />
              <View style={styles.orderItemDetails}>
                <Text style={[styles.orderItemName, { color: theme.text }]}>
                  {orderItem.name || 'Unknown Product'}
                </Text>
                <View style={styles.orderItemMeta}>
                  <View style={styles.orderItemQuantity}>
                    <MaterialIcons name="shopping-cart" size={14} color={theme.textSecondary} />
                    <Text style={[styles.orderItemQuantityText, { color: theme.textSecondary }]}>
                      {orderItem.quantity || 1} × GH₵{orderItem.price?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <View style={[styles.orderItemSubtotalContainer, { backgroundColor: theme.primary + '10' }]}>
                    <Text style={[styles.orderItemSubtotal, { color: theme.primary }]}>
                      GH₵{((orderItem.price || 0) * (orderItem.quantity || 1)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Actions */}
        {item.orderStatus === 'pending' && (
          <View style={styles.orderActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton, { backgroundColor: theme.success }]}
              onPress={() => {
                Alert.alert(
                  'Accept Order',
                  'Are you sure you want to accept this order? This will change the status to Processing.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Accept',
                      onPress: () => handleUpdateOrderStatus(item._id, 'processing')
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="check-circle" size={20} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.chatCard, { backgroundColor: theme.cardBackground }]}
      onPress={() => navigation.navigate('Chat', { chatId: item.id, customer: item.customer })}
    >
      <View style={[styles.chatAvatar, { backgroundColor: item.unread > 0 ? theme.primary : theme.secondary }]}>
        <Text style={styles.chatAvatarText}>{item.customer.charAt(0)}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread}</Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatCustomer, { color: theme.text }]}>{item.customer}</Text>
          <Text style={[styles.chatTimestamp, { color: theme.textSecondary }]}>{item.timestamp}</Text>
        </View>
        <Text 
          style={[styles.chatMessage, { color: item.unread > 0 ? theme.text : theme.textSecondary }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color={theme.textSecondary} 
        style={styles.chatArrow}
      />
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <View style={styles.tabContent}>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading orders...
                </Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No orders yet
                </Text>
                <Text style={[styles.emptyStateSubText, { color: theme.textSecondary }]}>
                  When customers purchase your products, their orders will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                onEndReached={handleLoadMoreOrders}
                onEndReachedThreshold={0.5}
                refreshing={refreshing}
                onRefresh={handleRefreshOrders}
                ListFooterComponent={() => (
                  loading && hasMoreOrders ? (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator color={theme.primary} />
                      <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>
                        Loading more orders...
                      </Text>
                    </View>
                  ) : null
                )}
              />
            )}
          </View>
        );
      case 'profile':
        return (
          <ScrollView style={styles.profileContainer}>
            <View style={[styles.profileHeader, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.profileCover}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  style={styles.coverGradient}
                />
              </View>
              
              <View style={styles.profileAvatarSection}>
                <TouchableOpacity style={styles.avatarContainer}>
                  {profileData.avatar ? (
                    <Image 
                      source={{ uri: profileData.avatar }} 
                      style={styles.avatarImage} 
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                      <Text style={styles.avatarText}>
                      </Text>
                    </View>
                  )}
                  <View style={styles.editAvatarButton}>
                    <MaterialIcons name="camera-alt" size={16} color="white" />
                  </View>
                </TouchableOpacity>
                
                {!profileData.isPremium && (
                  <TouchableOpacity 
                    style={styles.premiumBadge}
                    onPress={handlePremiumUpgrade}
                  >
                    <MaterialIcons name="workspace-premium" size={16} color={theme.warning} />
                    <Text style={styles.premiumBadgeText}>Promote your Store</Text>
                  </TouchableOpacity>
                )}
                
                {profileData.isPremium && (
                  <View style={styles.premiumSellerBadge}>
                    <MaterialIcons name="verified" size={16} color="white" />
                    <Text style={styles.premiumSellerText}>Premium Seller</Text>
                  </View>
                )}
              </View>
              
            
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {/* {profileData.totalSales} */}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Sales
                  </Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <View style={styles.ratingValue}>
                    <Text style={[styles.statValue, { color: theme.warning }]}>
                      {/* {profileData.rating} */}
                    </Text>
                    {/* <MaterialIcons name="star" size={16} color={theme.warning} /> */}
                  </View>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Rating
                  </Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {/* {profileData.followers} */}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Followers
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.profileContent}>

              <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: theme.danger }]}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={20} color="white" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      default:
        return (
          <>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: theme.text }]}>My Products</Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={handleAddProduct}
              >
                <Text style={styles.addButtonText}>Add Product</Text>
                <MaterialIcons name="add" size={18} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Status info section */}
            {showStatusGuide && (
              <View style={[styles.statusInfoContainer, { 
                backgroundColor: theme.cardBackground,
                borderLeftColor: theme.primary 
              }]}>
                <Text style={[styles.statusInfoTitle, { color: theme.text }]}>Product Status Guide:</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: 'rgba(255, 159, 28, 0.9)' }]} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    <Text style={[styles.statusBold, { color: theme.text }]}>Pending:</Text> Your product is awaiting admin approval.
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: 'rgba(46, 196, 182, 0.9)' }]} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    <Text style={[styles.statusBold, { color: theme.text }]}>Approved:</Text> Product is live on the marketplace.
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: 'rgba(230, 57, 70, 0.9)' }]} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    <Text style={[styles.statusBold, { color: theme.text }]}>Rejected:</Text> Product didn't meet marketplace requirements.
                  </Text>
                </View>
              </View>
            )}
            
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inventory" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  Welcome! Start by adding your first product.
                </Text>
                <Text style={[styles.emptyStateSubText, { color: theme.textSecondary }]}>
                  All products will be reviewed by an admin before appearing in the marketplace.
                </Text>
                <TouchableOpacity 
                  style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddProduct}
                >
                  <Text style={styles.emptyStateButtonText}>Add New Product</Text>
                  <MaterialIcons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={item => item._id || item.id}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </>
        );
    }
  };

  // Add this to your modal to display error/success messages
  const renderMessages = () => (
    <>
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
      
      {successMessage ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}
    </>
  );

  // Add this new component for the horizontal category selector
  const CategorySelector = ({ categories, selectedCategory, onSelect, type }) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScrollView}
    >
      {Object.values(categories[type]).map((category, index) => (
        <TouchableOpacity
          key={`${type}-${index}`}
          style={[
            styles.categoryItem,
            selectedCategory === category && styles.categoryItemSelected
          ]}
          onPress={() => onSelect(category)}
        >
          <Text style={[
            styles.categoryItemText,
            selectedCategory === category && styles.categoryItemTextSelected
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const pickImage = async (isMain, index) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        
        if (isMain) {
          setProductForm({ ...productForm, image: base64Image });
        } else {
          const newImages = [...productForm.additionalImages];
          newImages[index] = base64Image;
          setProductForm({ ...productForm, additionalImages: newImages });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  const handleEditProfile = () => {
    // Initialize form with current profile data
    setProfileForm({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      bio: profileData.bio,
      location: profileData.location,
      avatar: profileData.avatar
    });
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token from storage:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        // throw new Error('Authentication required');
      }

      // Validate form inputs
      if (!profileForm.name || !profileForm.email || !profileForm.phone) {
        setErrorMessage('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Ensure token is properly formatted
      const headers = {
        'Authorization': `Bearer ${token.trim()}`, // Add trim() to remove any whitespace
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      console.log('Request headers:', headers);
      console.log('Request URL:', `${API_BASE_URL}/api/seller/profile`);
      
      const response = await fetch(`${API_BASE_URL}/api/seller/profile`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
          bio: profileForm.bio ? profileForm.bio.trim() : '',
          location: profileForm.location ? profileForm.location.trim() : '',
          avatar: profileForm.avatar
        })
      });

      // Log the response status and headers for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        // Check if token is expired
        if (response.status === 401) {
          // Clear stored token and redirect to login
          await AsyncStorage.removeItem('userToken');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          throw new Error('Session expired. Please login again.');
        }
        
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      console.log('Server response:', updatedProfile);
      
      setProfileData(updatedProfile);
      setSuccessMessage('Profile updated successfully');
      
      setTimeout(() => {
        setProfileModalVisible(false);
        setSuccessMessage('');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        
        // Option 1: Store the base64 image to send with the profile update
        setProfileForm({ ...profileForm, avatar: base64Image });
        
        // Option 2: Upload the image immediately to get a URL
        // This is useful if your API doesn't accept base64 images
        // await uploadProfileImage(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  // Optional: Separate function to upload profile image
  const uploadProfileImage = async (imageAsset) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        // throw new Error('Authentication required');
      }
      
      // Create form data for the image upload
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      });
      
      const response = await fetch(`${API_BASE_URL}/api/users/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      // Update the form with the image URL returned from the server
      setProfileForm({ ...profileForm, avatar: data.avatarUrl });
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to handle premium upgrade
  const handlePremiumUpgrade = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        // throw new Error('Authentication required');
      }
      
      // Navigate to premium upgrade screen or show payment modal
      navigation.navigate('PromoteStore');
      
      // Alternatively, you could implement the premium upgrade flow directly here
      // const response = await fetch(`${API_BASE_URL}/api/users/premium-upgrade`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to upgrade to premium');
      // }
      
      // const data = await response.json();
      // setProfileData({ ...profileData, isPremium: true });
      // alert('Successfully upgraded to Premium Seller!');
      
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      alert('Failed to upgrade to premium. Please try again.');
    }
  };

  // Add a logout function
  const handleLogout = async () => {
    try {
      // Clear all auth-related storage
      await AsyncStorage.multiRemove(['userToken', 'userId', 'userRole']);
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation even if storage clear fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  // Enhanced animation for promote store icon
  useEffect(() => {
    const startAnimation = () => {
      // Reset values
      promoteIconScale.setValue(1);
      promoteIconRotate.setValue(0);

      // Create parallel animations
      Animated.parallel([
        // Scale animation
        Animated.sequence([
          Animated.timing(promoteIconScale, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(promoteIconScale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]),
        // Rotation animation
        Animated.sequence([
          Animated.timing(promoteIconRotate, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(promoteIconRotate, {
            toValue: 0,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Add a small delay before starting the next animation cycle
        setTimeout(startAnimation, 500);
      });
    };

    startAnimation();

    // Cleanup animation on component unmount
    return () => {
      promoteIconScale.stopAnimation();
      promoteIconRotate.stopAnimation();
    };
  }, []);

  // Add animation for orders icon when there are new orders
  useEffect(() => {
    if (newOrdersCount > 0) {
      const pulseAnimation = Animated.sequence([
        Animated.timing(ordersIconScale, {
          toValue: 1.2,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ordersIconScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(pulseAnimation, { iterations: 3 }).start();
    }
  }, [newOrdersCount]);

  // Add this function to check for new orders
  const checkNewOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/orders/seller/new`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewOrdersCount(data.newOrdersCount || 0); // Update to use count instead of boolean
      }
    } catch (error) {
      console.error('Error checking new orders:', error);
    }
  };

  // Add this to your existing useEffect that fetches orders
  useEffect(() => {
    checkNewOrders();
    // Set up interval to check for new orders every minute
    const interval = setInterval(checkNewOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <LinearGradient
        colors={['#5D3FD3', '#3730A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('PromoteStore')}
            >
              <Animated.View 
                style={{ 
                  transform: [
                    { scale: promoteIconScale },
                    { 
                      rotate: promoteIconRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '20deg']
                      })
                    }
                  ]
                }}
              >
                <MaterialIcons name="campaign" size={24} color="white" />
                <View style={styles.promoteGlow} />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => {
                setNewOrdersCount(0); // Reset count when viewing orders
                setActiveTab('orders');
              }}
            >
              <Animated.View style={{ transform: [{ scale: ordersIconScale }] }}>
                <MaterialIcons name="shopping-bag" size={24} color="white" />
                {newOrdersCount > 0 && (
                  <View style={styles.ordersBadge}>
                    <Text style={styles.ordersBadgeText}>{newOrdersCount}</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
      
      <View style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <MaterialIcons 
            name="inventory" 
            size={24} 
            color={activeTab === 'products' ? theme.primary : theme.textSecondary} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'products' ? theme.primary : theme.textSecondary }]}>
            Products
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <MaterialIcons 
            name="shopping-bag" 
            size={24} 
            color={activeTab === 'orders' ? theme.primary : theme.textSecondary} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'orders' ? theme.primary : theme.textSecondary }]}>
            Orders
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <MaterialIcons 
            name="person" 
            size={24} 
            color={activeTab === 'profile' ? theme.primary : theme.textSecondary} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? theme.primary : theme.textSecondary }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {renderMessages()}
            
            <ScrollView style={styles.formScrollView}>
              {/* Render rejection reason if editing a rejected product */}
              {isEditing && productForm.rejectionReason && (
                <View style={styles.rejectionReasonContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.danger }]}>
                    Rejection Reason:
                  </Text>
                  <View style={styles.rejectionReasonBox}>
                    <Text style={styles.rejectionReasonText}>
                      {productForm.rejectionReason}
                    </Text>
                  </View>
                  <Text style={styles.rejectionInstructions}>
                    Please address the issues above, then resubmit your product.
                  </Text>
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton,
                      !productForm.isService && styles.typeButtonSelected
                    ]}
                    onPress={() => setProductForm({...productForm, isService: false, category: ''})}
                  >
                    <MaterialIcons 
                      name="inventory" 
                      size={24} 
                      color={!productForm.isService ? theme.primary : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      !productForm.isService && styles.typeButtonTextSelected
                    ]}>Product</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton,
                      productForm.isService && styles.typeButtonSelected
                    ]}
                    onPress={() => setProductForm({...productForm, isService: true, category: ''})}
                  >
                    <MaterialIcons 
                      name="miscellaneous-services" 
                      size={24} 
                      color={productForm.isService ? theme.primary : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      productForm.isService && styles.typeButtonTextSelected
                    ]}>Service</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Category</Text>
                <CategorySelector 
                  categories={categories}
                  selectedCategory={productForm.category}
                  onSelect={(category) => setProductForm({...productForm, category})}
                  type={productForm.isService ? 'SERVICES' : 'PRODUCTS'}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
                <View style={styles.basicInfoContainer}>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                      value={productForm.name}
                      onChangeText={(text) => setProductForm({...productForm, name: text})}
                      placeholder={productForm.isService ? "Enter service name (e.g. Graphic Design)" : "Enter product name"}
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>
                  
                  {!productForm.isService && (
                    <>
                      <View style={styles.inputWrapper}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>Gender</Text>
                        <View style={[styles.input, { backgroundColor: theme.inputBackground }]}>
                          <Picker
                            selectedValue={productForm.gender}
                            onValueChange={(value) => setProductForm({...productForm, gender: value})}
                            style={{ color: theme.text }}
                          >
                            <Picker.Item label="Select Gender" value="" />
                            <Picker.Item label="Men" value="men" />
                            <Picker.Item label="Women" value="women" />
                            <Picker.Item label="Unisex" value="unisex" />
                          </Picker>
                        </View>
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>Color</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                          value={productForm.color}
                          onChangeText={(text) => setProductForm({...productForm, color: text})}
                          placeholder="Enter product color"
                          placeholderTextColor={theme.textSecondary}
                        />
                      </View>
                    </>
                  )}
                  
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Price</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                      value={productForm.price}
                      onChangeText={(text) => setProductForm({...productForm, price: text})}
                      placeholder={productForm.isService ? "Enter service fee (e.g. 50 for hourly rate)" : "Enter price"}
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  {!productForm.isService && (
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, { color: theme.text }]}>Stock Quantity</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                        value={productForm.stock}
                        onChangeText={(text) => setProductForm({...productForm, stock: text})}
                        placeholder="Enter stock quantity"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                  
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Description</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text }]}
                      value={productForm.description}
                      onChangeText={(text) => setProductForm({...productForm, description: text})}
                      placeholder={productForm.isService ? 
                        "Describe your service in detail (e.g. I offer professional graphic design services including logo design, brand identity, and social media graphics. 3-day turnaround time.)" : 
                        "Enter product description"}
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {productForm.isService ? 'Service Images' : 'Product Images'}
                </Text>
                
                {/* Main Image */}
                <View style={styles.mainImageContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.mainImagePicker,
                      { backgroundColor: theme.inputBackground }
                    ]}
                    onPress={() => pickImage(true, null)}
                  >
                    {productForm.image ? (
                      <Image 
                        source={{ uri: productForm.image }}
                        style={styles.mainImagePreview}
                      />
                    ) : (
                      <View style={styles.mainImagePlaceholder}>
                        <MaterialIcons name="add-photo-alternate" size={40} color={theme.primary} />
                        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                          {productForm.isService ? 'Add Service Image' : 'Add Main Product Image'}
                        </Text>
                      </View>
                    )}
                    {productForm.image && (
                      <View style={styles.imageOverlay}>
                        <TouchableOpacity 
                          style={styles.changeImageButton}
                          onPress={() => pickImage(true, null)}
                        >
                          <MaterialIcons name="edit" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Additional Images */}
                <View style={styles.additionalImagesContainer}>
                  <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
                    Additional Images (Optional)
                  </Text>
                  <View style={styles.imageGrid}>
                    {[0, 1, 2].map((index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.additionalImagePicker,
                          { backgroundColor: theme.inputBackground }
                        ]}
                        onPress={() => pickImage(false, index)}
                      >
                        {productForm.additionalImages[index] ? (
                          <>
                            <Image
                              source={{ uri: productForm.additionalImages[index] }}
                              style={styles.additionalImagePreview}
                            />
                            <View style={styles.imageOverlay}>
                              <TouchableOpacity 
                                style={styles.changeImageButton}
                                onPress={() => pickImage(false, index)}
                              >
                                <MaterialIcons name="edit" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          <View style={styles.additionalImagePlaceholder}>
                            <MaterialIcons name="add-photo-alternate" size={24} color={theme.textSecondary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveProduct}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Product' : 'Create Product'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
    overflow: 'visible',
  },
  promoteTooltip: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    opacity: 0,
    transform: [{ translateY: 10 }],
  },
  promoteTooltipText: {
    color: 'white',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  ordersBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E63946',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5D3FD3',
    paddingHorizontal: 4,
  },
  ordersBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderTopWidth: 3,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    color: 'white',
    marginRight: 6,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  productBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 52, // Position below the status badge
    right: 12,
    backgroundColor: 'rgba(230, 57, 70, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  lowStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginRight: 6,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginRight: 2,
  },
  productActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  actionButtonText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  orderHeaderGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderCustomerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDetails: {
    gap: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: 13,
  },
  orderTotalContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderItemsContainer: {
    padding: 16,
  },
  orderItemsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 8,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  orderItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderItemQuantityText: {
    fontSize: 13,
  },
  orderItemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  viewButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  acceptButton: {
    backgroundColor: '#2EC4B6',
  },
  completeButton: {
    backgroundColor: '#2EC4B6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E63946',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatTimestamp: {
    fontSize: 12,
  },
  chatMessage: {
    fontSize: 14,
  },
  chatArrow: {
    marginLeft: 8,
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
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyStateButtonText: {
    color: 'white',
    marginRight: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formScrollView: {
    maxHeight: '90%',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#F0F4FF',
    borderColor: '#4361EE',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#6c757d',
  },
  typeButtonTextSelected: {
    color: '#4361EE',
    fontWeight: '600',
  },
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
  },
  categoryItemSelected: {
    backgroundColor: '#4361EE',
  },
  categoryItemText: {
    color: '#6c757d',
    fontSize: 14,
  },
  categoryItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  imageInputsContainer: {
    gap: 16,
  },
  mainImageContainer: {
    marginBottom: 24,
  },
  mainImagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  mainImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  additionalImagesContainer: {
    marginBottom: 24,
  },
  subTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  additionalImagePicker: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  additionalImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  additionalImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  changeImageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E63946',
  },
  errorText: {
    color: '#B71C1C',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2EC4B6',
  },
  successText: {
    color: '#1B5E20',
  },
  basicInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileCover: {
    height: 100,
    width: '100%',
    position: 'relative',
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  profileAvatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4361EE',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  premiumBadgeText: {
    color: '#FF9F1C',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  premiumSellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  premiumSellerText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinDateText: {
    fontSize: 14,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  profileContent: {
    padding: 16,
  },
  profileSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  editProfileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileImagePickerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  profileImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageOverlayText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 159, 28, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pendingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(230, 57, 70, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  rejectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  approvedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(46, 196, 182, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  approvedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusInfoContainer: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderLeftWidth: 3
  },
  statusInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  statusText: {
    fontSize: 14,
    flex: 1
  },
  statusBold: {
    fontWeight: 'bold'
  },
  rejectionReasonContainer: {
    marginBottom: 24,
  },
  rejectionReasonBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rejectionReasonText: {
    color: '#B71C1C',
  },
  rejectionInstructions: {
    color: '#6c757d',
    fontSize: 14,
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderItemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  orderTotalSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  orderSummarySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  promoteGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    opacity: 0.5,
  },
});

export default SellerDashboardScreen;
