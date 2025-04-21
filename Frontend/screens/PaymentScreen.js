import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { clearCart } from '../store/slices/cartSlice';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { 
  handlePaymentSuccessfulNotification, 
  handleOrderPlacedNotification 
} from '../services/notificationService';
import { addNotification } from '../store/slices/notificationSlice';
import { MaterialIcons } from '@expo/vector-icons';

const PAYSTACK_PUBLIC_KEY = 'pk_test_adab0e58f74cc222a31e9e82a291ae8de3952848';

const PaymentScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null); // 'online' or 'pay_on_delivery'
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector(state => state.cart);
  const { amount } = route.params;

  // Debug cart state
  useEffect(() => {
    console.log('Cart state in PaymentScreen:', cartItems);
    if (!cartItems || cartItems.length === 0) {
      console.warn('Warning: Cart items are empty or undefined in PaymentScreen');
    }
  }, [cartItems]);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setEmail(userData.email);
        } else {
          // Fallback to token approach if userData is not available
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            try {
              // Using the base URL since the specific endpoint might not be defined
              const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                setEmail(userData.email || '');
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    getUserEmail();
  }, []);

  const createOrder = async (reference, forcePaymentMethod = null) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log('Token available:', !!token);
      
      // Ensure we have cart items
      if (!cartItems || cartItems.length === 0) {
        console.error('Cart items are empty or undefined:', cartItems);
        throw new Error('Your cart is empty. Please add items before checkout.');
      }
      
      // Debug: Check cart items structure
      try {
        console.log('Cart items type:', typeof cartItems);
        console.log('Cart items count:', cartItems.length);
        console.log('First item keys:', Object.keys(cartItems[0] || {}));
        console.log('Raw cart items:', JSON.stringify(cartItems, null, 2));
      } catch (e) {
        console.error('Error inspecting cart items:', e);
      }
      
      // Prepare order items from cart with proper validation
      const orderItems = cartItems.map(item => {
        const productId = item.product?._id || item._id;
        const name = item.product?.name || item.name;
        const price = item.product?.price || item.price;
        const image = item.product?.image || item.image;
        const sellerId = item.product?.seller || item.seller;
        
        // Log each item for debugging
        console.log('Processing cart item:', { 
          productId, name, price, quantity: item.quantity, image, sellerId 
        });
        
        if (!productId || !name || !price) {
          console.error('Invalid item data:', item);
          throw new Error('Invalid product data in cart');
        }
        
        return {
          productId,
          name,
          quantity: item.quantity,
          price,
          image,
          sellerId
        };
      });

      // Final validation of order items
      if (!orderItems.length) {
        throw new Error('Failed to prepare order items from cart');
      }

      // Log the order details for debugging
      console.log('Prepared order items:', JSON.stringify(orderItems));
      console.log('Total amount:', amount);
      console.log('Payment reference:', reference);
      console.log('Payment method:', forcePaymentMethod || paymentMethod);

      // Use API_ENDPOINTS if available, otherwise construct URL from base
      const orderUrl = API_ENDPOINTS.CREATE_ORDER || `${API_BASE_URL}/api/orders`;
      console.log('Sending order to:', orderUrl);
      
      // Prepare the order payload - make sure orderItems is the property name used
      const orderPayload = {
        paymentReference: reference,
        orderItems: orderItems,  // This must match what backend expects
        totalAmount: amount,
        paymentMethod: forcePaymentMethod || paymentMethod,
        paymentStatus: (forcePaymentMethod || paymentMethod) === 'pay_on_delivery' ? 'pending' : 'success'
      };
      
      // Log the final payload being sent
      console.log('Final order payload:', JSON.stringify(orderPayload, null, 2));
      console.log('Payment method in payload:', forcePaymentMethod || paymentMethod);

      const response = await fetch(orderUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });
      
      // First check the content type to determine how to parse the response
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Server error details:', errorData);
            
            // Special handling for specific known errors
            if (errorData.message && errorData.message.includes('No order items')) {
              throw new Error('Cart validation failed. Please refresh your cart and try again.');
            }
            
            errorMessage = errorData.message || errorMessage;
          } else {
            // Handle non-JSON responses (like HTML error pages)
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
            errorMessage = 'Server returned an unexpected response format';
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = 'Unable to parse server response';
        }
        throw new Error(errorMessage);
      }
      
      // Check for proper JSON response before parsing
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Unexpected content type:', contentType);
        console.error('Response body:', responseText);
        throw new Error('Server returned an unexpected response format');
      }
      
      const data = await response.json();
      console.log('Order created successfully:', data);
      return data;  // Return the created order data
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(error.message || 'Error processing order');
    }
  };

  const handlePayOnDelivery = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting Pay on Delivery flow with payment method:', paymentMethod);
      
      // Make sure payment method is set correctly
      if (paymentMethod !== 'pay_on_delivery') {
        console.log('Payment method not set properly, forcing to pay_on_delivery');
        setPaymentMethod('pay_on_delivery');
      }
      
      // Generate a unique pay-on-delivery reference
      const payOnDeliveryRef = `POD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      console.log('Generated POD reference:', payOnDeliveryRef);
      
      // Create the order with the POD reference
      const orderResult = await createOrder(payOnDeliveryRef, 'pay_on_delivery');
      console.log('POD Order created:', orderResult);
      
      // Generate an order number from the order ID
      const orderNumber = orderResult._id.substring(orderResult._id.length - 6).toUpperCase();
      
      // Send local notifications
      const notificationId = await handleOrderPlacedNotification(orderNumber);
      console.log('Order placed notification sent:', notificationId);
      
      // Add notification to Redux store
    
      
      // Clear cart after successful order creation
      dispatch(clearCart());
      
      // Navigate to success screen
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'PaymentSuccess',
          params: {
            orderNumber: orderNumber,
            amount: amount,
            orderId: orderResult._id,
            isPOD: true
          }
        }],
      });
    } catch (error) {
      setIsProcessing(false);
      console.error('Error in handlePayOnDelivery:', error);
      
      Alert.alert(
        'Order Processing Error',
        error.message || 'An error occurred while processing your order',
        [
          {
            text: 'Try Again',
            onPress: () => console.log('Try again pressed')
          },
          {
            text: 'Go to Home',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'BuyerHome' }],
            })
          }
        ]
      );
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      console.log('Payment successful, full response:', response);
      
      // Validate cart state before proceeding
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart appears to be empty. Please add items before completing checkout.');
      }
      
      // Extract payment reference from Paystack response
      const paymentReference = response?.data?.transactionRef?.reference || 
                             response?.transactionRef?.reference || 
                             response?.reference;
      
      if (!paymentReference) {
        console.error('Payment response structure:', response);
        throw new Error('No payment reference received from Paystack');
      }

      console.log('Creating order with payment reference:', paymentReference);
      const orderResult = await createOrder(paymentReference, 'online');
      console.log('Order created:', orderResult);
      
      // Generate a order number from the order ID (could be any unique value)
      const orderNumber = orderResult._id.substring(orderResult._id.length - 6).toUpperCase();
      
      // Send local notifications
      const notificationId1 = await handleOrderPlacedNotification(orderNumber);
      console.log('Order placed notification sent:', notificationId1);
      
      const notificationId2 = await handlePaymentSuccessfulNotification(
        orderNumber,
        `Thank you for your purchase! Your payment of GHS ${amount} has been confirmed.`
      );
      console.log('Payment successful notification sent:', notificationId2);
      
      // Also add notifications to Redux store for the notification center
      dispatch(addNotification({
        title: 'Order Placed',
        body: `Your order #${orderNumber} has been placed successfully.`,
        data: { 
          type: 'ORDER_PLACED',
          orderId: orderResult._id
        }
      }));
      
      dispatch(addNotification({
        title: 'Payment Successful',
        body: `Your payment of GHS ${amount} for order #${orderNumber} has been confirmed.`,
        data: { 
          type: 'PAYMENT_SUCCESSFUL',
          orderId: orderResult._id,
          amount: amount
        }
      }));
      
      // Only clear cart after successful order creation
      dispatch(clearCart());
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'PaymentSuccess',
          params: {
            orderNumber: orderNumber,
            amount: amount,
            orderId: orderResult._id
          }
        }],
      });
    } catch (error) {
      console.error('Error in handlePaymentSuccess:', error);
      
      // Check for empty cart or order items errors
      if (error.message.includes('cart is empty') || 
          error.message.includes('No order items') ||
          error.message.includes('Invalid product data')) {
        
        Alert.alert(
          'Order Error',
          'There was an issue with your cart items. Please try refreshing your cart and try again.',
          [
            {
              text: 'Go to Cart',
              onPress: () => navigation.navigate('Cart')
            },
            {
              text: 'Go to Home',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'BuyerHome' }],
              })
            }
          ]
        );
      }
      // Check for specific JSON parsing errors that indicate HTML responses
      else if (error.message.includes('Unexpected token') || 
          error.message.includes('Unexpected character') || 
          error.message.includes('JSON Parse error')) {
        
        Alert.alert(
          'Server Communication Error',
          'Unable to process your order due to a server communication issue. Please try again later or contact support.',
          [
            {
              text: 'Try Again',
              onPress: () => console.log('Try again pressed')
            },
            {
              text: 'Go to Home',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'BuyerHome' }],
              })
            }
          ]
        );
      }
      // Handle network timeouts by showing a more optimistic message
      else if (error.message.includes('timed out') || error.message.includes('network')) {
        dispatch(clearCart());
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'PaymentSuccess',
            params: { 
              isProcessing: true,
              message: 'Your payment was successful! Your order is being processed and will be confirmed shortly. You will receive an email confirmation once completed.'
            }
          }],
        });
      } else {
        Alert.alert(
          'Order Processing Error',
          error.message || 'An error occurred while processing your order',
          [
            {
              text: 'Try Again',
              onPress: () => console.log('Try again pressed')
            },
            {
              text: 'Go to Home',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'BuyerHome' }],
              })
            }
          ]
        );
      }
    }
  };

  const handlePaymentCancel = () => {
    setPaymentMethod(null);
    navigation.goBack();
  };

  if (!email) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
      </View>
    );
  }

  // Verify cart has items before proceeding with payment
  if (!cartItems || cartItems.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Your cart appears to be empty.</Text>
        <Text style={styles.errorSubText}>Please add items before checkout.</Text>
        <Text 
          style={styles.linkText}
          onPress={() => navigation.navigate('BuyerHome')}
        >
          Return to Home
        </Text>
      </View>
    );
  }

  // If user hasn't selected a payment method yet, show payment method selection screen
  if (!paymentMethod) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.pageTitle}>Choose Payment Method</Text>
          <Text style={styles.amountText}>Total: GHS {(amount).toFixed(2)}</Text>
          
          <TouchableOpacity 
            style={styles.paymentOption}
            onPress={() => setPaymentMethod('online')}
          >
            <MaterialIcons name="credit-card" size={24} color="#5D3FD3" />
            <View style={styles.paymentOptionTextContainer}>
              <Text style={styles.paymentOptionTitle}>Pay Online</Text>
              <Text style={styles.paymentOptionDescription}>
                Pay securely with credit card, mobile money, or bank transfer
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.paymentOption}
            onPress={() => {
              // Explicitly set payment method first, then handle pay on delivery
              setPaymentMethod('pay_on_delivery');
              // Use setTimeout to ensure state is updated before handling the flow
              setTimeout(() => {
                handlePayOnDelivery();
              }, 0);
            }}
          >
            <MaterialIcons name="attach-money" size={24} color="#5D3FD3" />
            <View style={styles.paymentOptionTextContainer}>
              <Text style={styles.paymentOptionTitle}>Pay on Delivery</Text>
              <Text style={styles.paymentOptionDescription}>
                Pay with cash or mobile money when your order is delivered
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handlePaymentCancel}
          >
            <Text style={styles.backButtonText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Show loading indicator while processing Pay on Delivery
  if (paymentMethod === 'pay_on_delivery' && isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  // Show Paystack payment screen only if online payment is selected
  return (
    <View style={styles.container}>
      <Paystack
        paystackKey={PAYSTACK_PUBLIC_KEY}
        amount={amount} // Amount is already in pesewas, don't multiply
        billingEmail={email}
        activityIndicatorColor="#5D3FD3"
        onCancel={() => {
          setPaymentMethod(null);
          handlePaymentCancel();
        }}
        onSuccess={handlePaymentSuccess}
        autoStart={true}
        channels={["card", "bank", "ussd", "qr", "mobile_money"]}
        currency="GHS"
        reference={`order_${Date.now()}_${Math.floor(Math.random() * 1000)}`}
        refundable={true}
        handleWebViewMessage={(e) => {
          // Handle any messages from the webview
          console.log('Webview message:', e);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5D3FD3'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  errorSubText: {
    fontSize: 16,
    marginBottom: 20
  },
  linkText: {
    color: '#5D3FD3',
    fontWeight: 'bold'
  },
  paymentMethodContainer: {
    padding: 20,
    backgroundColor: '#fff'
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center'
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#5D3FD3'
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  paymentOptionTextContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#666'
  },
  backButton: {
    alignItems: 'center',
    marginTop: 30,
    padding: 15
  },
  backButtonText: {
    color: '#999',
    fontSize: 16
  }
});

export default PaymentScreen; 