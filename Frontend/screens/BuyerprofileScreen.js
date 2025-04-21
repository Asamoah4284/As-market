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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const BuyerProfileScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'profile');
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
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
              <TouchableOpacity style={styles.profileOption}>
                <Ionicons name="settings-outline" size={24} color="#666" />
                <Text style={styles.optionText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileOption}>
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
          <View key={order._id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemPrice}>GH₵{item.price.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <View style={styles.orderStatusContainer}>
                {/* <Text style={styles.orderStatus}>
                  Status: <Text style={styles.statusText}>{order.orderStatus}</Text>
                </Text> */}
                <Text style={styles.paymentMethod}>
                  Payment: <Text style={styles.paymentMethodText}>
                    {(order.paymentInfo?.paymentMethod === 'online' ||
                     order.paymentInfo?.paymentMethod === 'paystack' ||
                     order.paymentInfo?.status === 'success' ||
                     order.paymentStatus === 'success' ||
                     (order.paymentReference && !order.paymentReference.startsWith('POD-'))) 
                     ? 'Online' 
                     : (order.paymentInfo?.paymentMethod === 'pay_on_delivery' ||
                        order.paymentMethod === 'pay_on_delivery' ||
                        (order.paymentReference && order.paymentReference.startsWith('POD-')))
                       ? 'Pay on Delivery'
                       : 'Pay on Delivery'}
                  </Text>
                </Text>
              </View>
              <Text style={styles.orderTotal}>
                Total: <Text style={styles.totalAmount}>GH₵{order.totalAmount.toFixed(2)}</Text>
              </Text>
            </View>
          </View>
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderItems: {
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3FD3',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  orderStatusContainer: {
    flexDirection: 'column',
  },
  orderStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodText: {
    color: '#5D3FD3',
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-end',
  },
  totalAmount: {
    color: '#333',
    fontWeight: '600',
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

export default BuyerProfileScreen;
