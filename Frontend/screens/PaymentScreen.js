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
  const { amount, shippingDetails, paymentMethod: initialPaymentMethod } = route.params || {};

  // Only set initial payment method if it's provided
  useEffect(() => {
    if (initialPaymentMethod) {
      setPaymentMethod(initialPaymentMethod);
    } else {
      // Ensure paymentMethod is null to show payment options
      setPaymentMethod(null);
    }
  }, [initialPaymentMethod]);

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
      
      // Debug: Log cartItems before preparing the order
      console.log('Cart items before preparing order:', JSON.stringify(cartItems, null, 2));
      
      // Format the order items according to what backend expects
      const formattedOrderItems = cartItems.map(item => {
        return {
          productId: item.product?._id || item._id || item.productId,
          name: item.product?.name || item.name,
          price: item.product?.price || item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image,
          sellerId: item.product?.seller || item.seller || item.sellerId
        };
      });
      
      console.log('Formatted order items:', JSON.stringify(formattedOrderItems, null, 2));
      
      // Get the token for authentication
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');
      
      // Ensure location is never empty and is one of the required enum values
      let locationValue = shippingDetails?.shippingAddress?.location || '';
      
      // Define valid locations based on backend schema
      const validLocations = [
        'OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 
        'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 
        'ATL', 'OGUAA', 'KNH'
      ];
      
      // Check if location needs to be normalized (uppercase)
      if (locationValue && !validLocations.includes(locationValue)) {
        // Try to normalize it
        const normalizedLocation = locationValue.toUpperCase();
        if (validLocations.includes(normalizedLocation)) {
          locationValue = normalizedLocation;
        }
      }

      // Validate location before sending
      if (!locationValue || !validLocations.includes(locationValue)) {
        console.error('Invalid location:', locationValue);
        throw new Error(`Invalid delivery location. Please go back and select from the available locations.`);
      }
      
      console.log('DEBUG - Using location value:', locationValue);
      console.log('DEBUG - Is location valid:', validLocations.includes(locationValue));
      
      // Debug shipping details
      console.log('DEBUG - Full shipping details object:', JSON.stringify(shippingDetails, null, 2));
      
      // Prepare the order payload
      const orderPayload = {
        paymentReference: payOnDeliveryRef,
        orderItems: formattedOrderItems,
        totalAmount: amount,
        paymentMethod: 'pay_on_delivery',
        shippingAddress: {
          location: locationValue,
          roomNumber: shippingDetails?.shippingAddress?.roomNumber || '',
          additionalInfo: shippingDetails?.shippingAddress?.additionalInfo || ''
        },
        buyerContact: {
          phone: shippingDetails?.buyerContact?.phone || '',
          alternativePhone: shippingDetails?.buyerContact?.alternativePhone || ''
        },
        preferredDeliveryDay: shippingDetails?.preferredDeliveryDay || new Date()
      };
      
      console.log('Order payload for POD:', JSON.stringify(orderPayload, null, 2));
      
      // Send the create order request
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server responded with error:', responseData);
        throw new Error(responseData.message || 'Failed to create order');
      }
      
      console.log('POD Order created:', responseData);
      
      // Generate an order number from the order ID
      const orderNumber = responseData._id.substring(responseData._id.length - 6).toUpperCase();
      
      // Send local notifications
      const notificationId = await handleOrderPlacedNotification(orderNumber);
      console.log('Order placed notification sent:', notificationId);
      
      // Add notification to Redux store
      dispatch(addNotification({
        title: 'Order Placed',
        body: `Your order #${orderNumber} has been placed successfully.`,
        data: { 
          type: 'ORDER_PLACED',
          orderId: responseData._id
        }
      }));
      
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
            orderId: responseData._id,
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

      console.log('Payment reference received:', paymentReference);
      
      // Format the order items according to what backend expects
      const formattedOrderItems = cartItems.map(item => {
        return {
          productId: item.product?._id || item._id || item.productId,
          name: item.product?.name || item.name,
          price: item.product?.price || item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image,
          sellerId: item.product?.seller || item.seller || item.sellerId
        };
      });
      
      console.log('Formatted order items:', JSON.stringify(formattedOrderItems, null, 2));
      
      // Get the token for authentication
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');
      
      // Ensure location is never empty and is one of the required enum values
      let locationValue = shippingDetails?.shippingAddress?.location || '';
      
      // Define valid locations based on backend schema
      const validLocations = [
        'OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 
        'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 
        'ATL', 'OGUAA', 'KNH'
      ];
      
      // Check if location needs to be normalized (uppercase)
      if (locationValue && !validLocations.includes(locationValue)) {
        // Try to normalize it
        const normalizedLocation = locationValue.toUpperCase();
        if (validLocations.includes(normalizedLocation)) {
          locationValue = normalizedLocation;
        }
      }

      // Validate location before sending
      if (!locationValue || !validLocations.includes(locationValue)) {
        console.error('Invalid location:', locationValue);
        throw new Error(`Invalid delivery location. Please go back and select from the available locations.`);
      }
      
      console.log('DEBUG - Using location value:', locationValue);
      console.log('DEBUG - Is location valid:', validLocations.includes(locationValue));
      
      // Debug shipping details
      console.log('DEBUG - Full shipping details object:', JSON.stringify(shippingDetails, null, 2));
      
      // Prepare the order payload
      const orderPayload = {
        paymentReference: paymentReference,
        orderItems: formattedOrderItems,
        totalAmount: amount,
        paymentMethod: 'online',
        shippingAddress: {
          location: locationValue,
          roomNumber: shippingDetails?.shippingAddress?.roomNumber || '',
          additionalInfo: shippingDetails?.shippingAddress?.additionalInfo || ''
        },
        buyerContact: {
          phone: shippingDetails?.buyerContact?.phone || '',
          alternativePhone: shippingDetails?.buyerContact?.alternativePhone || ''
        },
        preferredDeliveryDay: shippingDetails?.preferredDeliveryDay || new Date()
      };
      
      console.log('Order payload for online payment:', JSON.stringify(orderPayload, null, 2));
      
      // Send the create order request
      const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });
      
      const responseData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        console.error('Server responded with error:', responseData);
        throw new Error(responseData.message || 'Failed to create order');
      }
      
      console.log('Online payment order created:', responseData);
      
      // Generate an order number from the order ID
      const orderNumber = responseData._id.substring(responseData._id.length - 6).toUpperCase();
      
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
          orderId: responseData._id
        }
      }));
      
      dispatch(addNotification({
        title: 'Payment Successful',
        body: `Your payment of GHS ${amount} for order #${orderNumber} has been confirmed.`,
        data: { 
          type: 'PAYMENT_SUCCESSFUL',
          orderId: responseData._id,
          amount: amount
        }
      }));
      
      // Only clear cart after successful order creation
      dispatch(clearCart());
      
      // For debugging - log the order data to console
      console.log('%c 🔍 ORDER DEBUG INFO', 'background: #222; color: #bada55; padding: 5px; border-radius: 5px;');
      console.log('Cart Items:', cartItems);
      console.log('Total Amount:', amount);
      console.log('Payment Method:', paymentMethod);
      console.log('Shipping Details:', shippingDetails);
      
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'PaymentSuccess',
          params: {
            orderNumber: orderNumber,
            amount: amount,
            orderId: responseData._id
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
          
          {/* Display shipping info summary */}
          {shippingDetails && (
            <View style={styles.shippingSummary}>
              <Text style={styles.sectionTitle}>Delivery Information</Text>
              <View style={styles.shippingDetail}>
                <Text style={styles.shippingLabel}>Location:</Text>
                <Text style={styles.shippingValue}>{shippingDetails.shippingAddress.location}</Text>
              </View>
              {shippingDetails.shippingAddress.roomNumber && (
                <View style={styles.shippingDetail}>
                  <Text style={styles.shippingLabel}>Room:</Text>
                  <Text style={styles.shippingValue}>{shippingDetails.shippingAddress.roomNumber}</Text>
                </View>
              )}
              <View style={styles.shippingDetail}>
                <Text style={styles.shippingLabel}>Phone:</Text>
                <Text style={styles.shippingValue}>{shippingDetails.buyerContact.phone}</Text>
              </View>
              <View style={styles.shippingDetail}>
                <Text style={styles.shippingLabel}>Delivery Date:</Text>
                <Text style={styles.shippingValue}>
                  {new Date(shippingDetails.preferredDeliveryDay).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
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
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Checkout</Text>
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
  shippingSummary: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  shippingDetail: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4
  },
  shippingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100
  },
  shippingValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
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