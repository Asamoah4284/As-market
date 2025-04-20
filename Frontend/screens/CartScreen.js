import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCartItems, 
  setLoading, 
  setError 
} from '../store/slices/cartSlice';
import PaystackPayment from '../components/PaystackPayment';
import { handleAddToCartNotification, sendLocalNotification } from '../services/notificationService';


const API_URL = 'http://172.20.10.3:5000';

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Replace useState with useSelector
  const { items: cartItems, loading, error } = useSelector(state => state.cart);
  const [showPayment, setShowPayment] = useState(false);
  const [userEmail, setUserEmail] = useState(''); // You should get this from user profile/auth
  const [userLocation, setUserLocation] = useState({
    coords: {
      latitude: 5.6037,  // Default location in Ghana (Accra)
      longitude: -0.1870
    }
  });
  const [isPayOnDelivery, setIsPayOnDelivery] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
          // Redirect to login if not authenticated
          Alert.alert(
            'Authentication Required',
            'Please log in or sign up to view your cart',
            [
              { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
              { text: 'Login', onPress: () => navigation.navigate('Login') }
            ]
          );
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          // Set loading to true immediately when screen is focused
          dispatch(setLoading(true));
          fetchCartItems();
        }
      };
      
      checkAuth();
    }, [])
  );

  // Add user email fetch
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const getUserEmail = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserEmail(userData.email);
          
          // If user has location data stored, retrieve it
          if (userData.location) {
            setUserLocation(userData.location);
          } else {
            // Default location in Ghana (Accra)
            setUserLocation({
              coords: {
                latitude: 5.6037,
                longitude: -0.1870
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    getUserEmail();
  }, [isAuthenticated]);

  // Modify fetchCartItems to use Redux
  const fetchCartItems = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        dispatch(setError('Please sign in to view your cart'));
        dispatch(setLoading(false));
        return;
      }

      const response = await axios.get(`${API_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const cartData = response.data.map(item => ({
        ...item,
        productId: item._id || item.productId,
        name: item.name || item.productName,
        price: parseFloat(item.price || 0),
        image: item.image || item.imageUrl || item.images?.[0],
        quantity: parseInt(item.quantity || 1),
      }));

      dispatch(setCartItems(cartData));
      dispatch(setError(null));
    } catch (err) {
      console.error('Error fetching cart:', err);
      dispatch(setError('Failed to load cart items'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Modify handleUpdateQuantity to use Redux and show notification
  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Get the product name for notification
      const product = cartItems.find(item => item.productId === productId);
      
      // Update optimistically
      dispatch(setCartItems(
        cartItems.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      ));

      const response = await axios.put(`${API_URL}/api/cart/${productId}`, {
        quantity: newQuantity,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        // Show notification when quantity is increased
        if (newQuantity > (product.quantity || 1)) {
          await handleAddToCartNotification(product.name || 'Product', dispatch);
        }
      } else {
        // Revert on failure
        fetchCartItems();
        Alert.alert('Error', 'Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      fetchCartItems();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Modify handleRemoveItem to use Redux
  const handleRemoveItem = async (productId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              
              // Remove optimistically
              dispatch(setCartItems(cartItems.filter(item => item.productId !== productId)));

                const response = await axios.delete(`${API_URL}/api/cart/${productId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.status !== 200) {
                // Revert on failure
                fetchCartItems();
                Alert.alert('Error', 'Failed to remove item');
              }
            } catch (err) {
              console.error('Error removing item:', err);
              fetchCartItems();
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryCost = (location) => {
    // Simple example calculation - could be more complex with real data
    // For this example, we'll use the distance from a fixed point (e.g., store location)
    const storeLatitude = 5.6037; // Example store location in Ghana
    const storeLongitude = -0.1870;
    
    // Calculate rough distance using Haversine formula
    const distance = calculateDistance(
      storeLatitude, 
      storeLongitude,
      location.coords.latitude,
      location.coords.longitude
    );
    
    // Base delivery fee GH₵5
    let deliveryFee = 5;
    
    // Add GH₵1 for each additional km after first 2 km
    if (distance > 2) {
      deliveryFee += Math.ceil(distance - 2);
    }
    
    // Cap the delivery fee at GH₵10
    deliveryFee = Math.min(deliveryFee, 10);
    
    return deliveryFee.toFixed(2);
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    // Add delivery fee if order is 50 or more
    if (subtotal >= 50) {
      const deliveryFee = userLocation ? parseFloat(calculateDeliveryCost(userLocation)) : 5;
      return subtotal + deliveryFee;
    }
    return subtotal;
  };

  // Update handlePaymentSuccess
  const handlePaymentSuccess = async (response) => {
    setShowPayment(false);
    console.log('Payment successful, response:', response);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const paymentReference = response?.data?.transactionRef?.reference || response?.transactionRef?.reference || response?.reference;
      
      if (!paymentReference) {
        console.error('Payment response structure:', response);
        throw new Error('No payment reference received from Paystack');
      }

      console.log('Creating order with reference:', paymentReference);
      
      // Send payment details to your backend
      const orderResponse = await axios.post(`${API_URL}/api/orders`, {
        paymentReference: paymentReference,
        items: cartItems,
        totalAmount: calculateFinalTotal(),
        paymentStatus: 'success'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (orderResponse.status === 201) {
        // Clear cart on backend
        await axios.delete(`${API_URL}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Clear cart in Redux
        dispatch(setCartItems([]));

        navigation.reset({
          index: 0,
          routes: [{ name: 'PaymentSuccess' }],
        });
      }
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert(
        'Error',
        'Payment was successful but there was an error processing your order. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Profile', { initialTab: 'orders' })
          }
        ]
      );
    }
  };

  // Update handleCheckout
  const handleCheckout = async () => {
    try {
      // Check if cart is empty
      if (cartItems.length === 0) {
        Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
        return;
      }

      // Check if user is logged in
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!token || !userData) {
        Alert.alert(
          'Login Required',
          'Please login to proceed with checkout',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Login',
              onPress: () => {
                // Save the cart state and redirect to login
                navigation.navigate('Login', {
                  redirectTo: 'Cart' // This will help us return to cart after login
                });
              }
            }
          ]
        );
        return;
      }

      // Calculate total amount
      const totalAmount = calculateFinalTotal();
      
      // Get user email from userData
      const user = JSON.parse(userData);
      if (!user.email) {
        Alert.alert('Error', 'Unable to proceed. Please update your profile with an email address.');
        return;
      }

      if (isPayOnDelivery) {
        // Handle pay on delivery option
        try {
          // Create order with payment status 'pending'
          const orderResponse = await axios.post(`${API_URL}/api/orders`, {
            paymentReference: 'POD-' + Date.now(), // Create a unique reference for pay on delivery
            items: cartItems,
            totalAmount: calculateFinalTotal(),
            paymentStatus: 'pending',
            paymentMethod: 'pay_on_delivery'
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (orderResponse.status === 201) {
            // Clear cart on backend
            await axios.delete(`${API_URL}/api/cart`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            // Clear cart in Redux
            dispatch(setCartItems([]));

            // Send a notification
            await sendLocalNotification(
              'Order Placed', 
              'Your order has been placed successfully. You will pay on delivery.'
            );

            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'PaymentSuccess',
                params: { payOnDelivery: true }
              }],
            });
          }
        } catch (error) {
          console.error('Error processing order:', error);
          Alert.alert('Error', 'There was an error processing your order. Please try again.');
        }
      } else {
        // Navigate to Payment screen with required data
        navigation.navigate('Payment', {
          amount: totalAmount,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setShowPayment(false);
    Alert.alert('Payment Cancelled', 'You have cancelled the payment');
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.itemImage}
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.productId)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF5A5F" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemPrice}>GH₵{item.price.toFixed(2)}</Text>
        
        <View style={styles.itemFooter}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Ionicons 
                name="remove" 
                size={16} 
                color={item.quantity <= 1 ? "#CCC" : "#FFF"} 
              />
            </TouchableOpacity>
            
            <View style={styles.quantityTextContainer}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
            >
              <Ionicons name="add" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.itemTotal}>
            GH₵{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5D3FD3" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {error === 'Please sign in to view your cart' && (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIconContainer}>
            <Ionicons name="cart-outline" size={64} color="#FFF" />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>Looks like you haven't added anything to your cart yet</Text>
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.continueShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Only render cart content if authenticated */}
      {isAuthenticated ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Cart</Text>
            <Text style={styles.itemCount}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.checkoutContainer}>
           
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Subtotal</Text>
                <Text style={styles.summaryValue}>GH₵{calculateTotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Delivery</Text>
                <Text style={styles.deliveryFeeText}>
                  {calculateTotal() < 50 ? 
                    "Free Delivery" : 
                    `+ GH₵${userLocation ? calculateDeliveryCost(userLocation) : "5-10"} Delivery`
                  }
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>Total</Text>
                <View style={styles.totalValueContainer}>
                  <Text style={styles.currencySymbol}>GH₵</Text>
                  <Text style={styles.totalAmount}>{calculateFinalTotal().toFixed(2)}</Text>
                </View>
              </View>
            </View>
            
          
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>
                {isPayOnDelivery ? "Place Order - Pay on Delivery" : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add the PaystackPayment component */}
          <PaystackPayment
            isVisible={showPayment}
            amount={calculateFinalTotal()}
            email={userEmail}
            onCancel={handlePaymentCancel}
            onSuccess={handlePaymentSuccess}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF3B30',
  },
  signInButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCartIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#5D3FD3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: '80%',
  },
  continueShoppingButton: {
    backgroundColor: '#5D3FD3',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#5D3FD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueShoppingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: Platform.OS === 'android' ? 16 : 10,

  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    // paddingBottom: 24,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    // borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    width: 120,
    height: 140,
    backgroundColor: '#F6F6F6',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
    height: 22,
    overflow: 'hidden',
    flexShrink: 1,
    flexWrap: 'nowrap'
  },
  removeButton: {
    padding: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5D3FD3',
    // marginVertical: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  quantityTextContainer: {
    minWidth: 30,
    // height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  checkoutContainer: {
    backgroundColor: 'white',
    // borderTopLeftRadius: 30,
    // borderTopRightRadius: 30,
    padding: 24,
    // paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  promoContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  promoInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },

  summaryContainer: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  shippingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3FD3',
    marginTop: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5D3FD3',
    marginLeft: 2,
  },
  checkoutButton: {
    backgroundColor: '#5D3FD3',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#5D3FD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  deliveryFeeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  paymentOptionContainer: {
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 14,
  },
});

export default CartScreen;
