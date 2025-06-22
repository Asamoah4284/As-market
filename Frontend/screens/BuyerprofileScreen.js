import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const BuyercdfileScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'profile');
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      checkUserRole();
      if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [activeTab, isAuthenticated]);

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      setIsAuthenticated(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkUserRole = async () => {
    try {
      const userRole = await AsyncStorage.getItem('userRole');
      setIsSeller(userRole === 'seller');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      console.log('Fetching orders with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Making request to fetch orders...');
      const response = await axios.get(API_ENDPOINTS.GET_MY_ORDERS, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Orders response received:', {
        status: response.status,
        orderCount: response.data?.length || 0
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Failed to fetch orders. ';
      if (error.response?.status === 401) {
        errorMessage += 'Please log in again.';
        // Handle unauthorized error
        AsyncStorage.removeItem('userToken');
        setIsAuthenticated(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (!error.response) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += 'Please try again later.';
      }

      Alert.alert(
        'Error',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setIsAuthenticated(false);
      setUserData(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleHelpAndSupport = () => {
    const phoneNumber = "0542343069";
    
    // Format the number - ensure it has international format
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, "");
    
    // If number doesn't start with +, add Ghana's country code
    if (!formattedPhone.startsWith('+')) {
      // If it starts with 0, replace the 0 with +233
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+233' + formattedPhone.substring(1);
      } else {
        // Otherwise just add +233 prefix
        formattedPhone = '+233' + formattedPhone;
      }
    }
    
    const message = "Hello! I need help and support with my Asarion Marketplace account.";
    
    // Try multiple WhatsApp URL formats for better compatibility
    const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    const whatsappUrlAlt = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    // First try the deep link format
    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // If deep link doesn't work, try the web URL format
          Linking.canOpenURL(whatsappUrlAlt)
            .then(webSupported => {
              if (webSupported) {
                return Linking.openURL(whatsappUrlAlt);
              } else {
                Alert.alert(
                  "WhatsApp Issue", 
                  "Unable to open WhatsApp. Please make sure WhatsApp is installed correctly or try reinstalling the app.",
                  [
                    { 
                      text: "Copy Number", 
                      onPress: () => {
                        Alert.alert("Phone number copied", `${formattedPhone}`);
                      }
                    },
                    { text: "OK" }
                  ]
                );
              }
            })
            .catch(err => console.error('Error opening WhatsApp web link:', err));
        }
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA500'; // Orange
      case 'processing':
        return '#2196F3'; // Blue
      case 'shipped':
        return '#9C27B0'; // Purple
      case 'delivered':
        return '#4CAF50'; // Green
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#666666'; // Gray
    }
  };

  const renderGuestProfileTab = () => (
    <View style={styles.guestContainer}>
      <View style={styles.guestAvatarContainer}>
        <Ionicons name="person-outline" size={80} color="#ccc" />
      </View>
      <Text style={styles.guestTitle}>Welcome to Asarion Marketplace</Text>
      <Text style={styles.guestSubtitle}>
        Sign in to view your profile, track orders, and manage your account
      </Text>
      
      <View style={styles.guestButtons}>
        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.createAccountButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.createAccountText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileTab = () => {
    if (!isAuthenticated) {
      return renderGuestProfileTab();
    }
    
    return (
      <View style={styles.tabContent}>
        {userData && (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={80} color="#5D3FD3" />
              </View>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
            </View>

            <View style={styles.profileOptions}>
              {isSeller && (
                <TouchableOpacity 
                  style={styles.profileOption}
                  onPress={() => navigation.navigate('SellerDashboard')}
                >
                  <Ionicons name="storefront-outline" size={24} color="#5D3FD3" />
                  <Text style={[styles.optionText, { color: '#5D3FD3' }]}>Seller Dashboard</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.profileOption}>
                <Ionicons name="settings-outline" size={24} color="#666" />
                <Text style={styles.optionText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileOption} onPress={handleHelpAndSupport}>
                <Ionicons name="help-circle-outline" size={24} color="#666" />
                <Text style={styles.optionText}>Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderGuestOrdersTab = () => (
    <View style={styles.guestContainer}>
      <Ionicons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.guestTitle}>No Orders Found</Text>
      <Text style={styles.guestSubtitle}>
        Sign in to view your order history and track current orders
      </Text>
      
      <TouchableOpacity 
        style={styles.signInButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrdersTab = () => {
    if (!isAuthenticated) {
      return renderGuestOrdersTab();
    }
    
    return (
      <ScrollView 
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchOrders} />
        }
      >
        {orders.map((order) => (
          <TouchableOpacity 
            key={order._id} 
            style={styles.orderCard}
            activeOpacity={0.9}
            onPress={() => {
              // You can add navigation to order details here if needed
              console.log('Order pressed:', order._id);
            }}
          >
            <View style={styles.orderCardHeader}>
              <View style={styles.orderHeaderLeft}>
                <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.orderStatus)}15` }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.orderStatus) }]} />
                <Text style={[styles.orderStatus, { color: getStatusColor(order.orderStatus) }]}>
                  {order.orderStatus || 'Pending'}
                </Text>
              </View>
            </View>
            
            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemPrice}>GH₵{item.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.orderCardFooter}>
              <View style={styles.paymentInfo}>
                <Ionicons 
                  name={order.paymentInfo?.paymentMethod === 'online' ? "card-outline" : "cash-outline"} 
                  size={16} 
                  color="#666" 
                />
                <Text style={styles.paymentMethod}>
                  {(order.paymentInfo?.paymentMethod === 'online' ||
                   order.paymentInfo?.paymentMethod === 'paystack' ||
                   order.paymentInfo?.status === 'success' ||
                   order.paymentStatus === 'success' ||
                   (order.paymentReference && !order.paymentReference.startsWith('POD-'))) 
                   ? 'Online Payment' 
                   : 'Pay on Delivery'}
                </Text>
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>GH₵{order.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {orders.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'profile' ? renderProfileTab() : renderOrdersTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5D3FD3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#5D3FD3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  profileOptions: {
    padding: 16,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#FF3B30',
  },
  orderCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fafafa',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderItems: {
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D3FD3',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    backgroundColor: '#fafafa',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  paymentMethod: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Guest user styles
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  guestAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  guestButtons: {
    width: '100%',
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: '#5D3FD3',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
    width: '80%',
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createAccountButton: {
    borderWidth: 1,
    borderColor: '#5D3FD3',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  createAccountText: {
    color: '#5D3FD3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BuyercdfileScreen;
