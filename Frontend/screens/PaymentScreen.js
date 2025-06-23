import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCart } from '../store/slices/cartSlice';
import { API_BASE_URL, PAYSTACK_PUBLIC_KEY } from '../config/api';
import { 
  handlePaymentSuccessfulNotification, 
  handleOrderPlacedNotification 
} from '../services/notificationService';
import { addNotification } from '../store/slices/notificationSlice';
import { MaterialIcons } from '@expo/vector-icons';

const PaymentScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector(state => state.cart);
  const { amount, shippingDetails, paymentMethod: initialPaymentMethod } = route.params || {};

  useEffect(() => {
    if (initialPaymentMethod) {
      setPaymentMethod(initialPaymentMethod);
    }
  }, [initialPaymentMethod]);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setEmail(userData.email);
        } else {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
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
      
      const payOnDeliveryRef = `POD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const formattedOrderItems = cartItems.map(item => ({
        productId: item.product?._id || item._id || item.productId,
        name: item.product?.name || item.name,
        price: item.product?.price || item.price,
        quantity: item.quantity,
        image: item.product?.image || item.image,
        sellerId: item.product?.seller || item.seller || item.sellerId
      }));
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');
      
      let locationValue = shippingDetails?.shippingAddress?.location || '';
      const validLocations = [
        'OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 
        'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 
        'ATL', 'OGUAA', 'KNH'
      ];
      
      if (locationValue && !validLocations.includes(locationValue)) {
        const normalizedLocation = locationValue.toUpperCase();
        if (validLocations.includes(normalizedLocation)) {
          locationValue = normalizedLocation;
        }
      }

      if (!locationValue || !validLocations.includes(locationValue)) {
        throw new Error('Invalid delivery location. Please go back and select from the available locations.');
      }
      
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
        throw new Error(responseData.message || 'Failed to create order');
      }
      
      const orderNumber = responseData._id.substring(responseData._id.length - 6).toUpperCase();
      
      await handleOrderPlacedNotification(orderNumber);
      
      dispatch(addNotification({
        title: 'Order Placed',
        body: `Your order #${orderNumber} has been placed successfully.`,
        data: { 
          type: 'ORDER_PLACED',
          orderId: responseData._id
        }
      }));
      
      dispatch(clearCart());
      
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
      Alert.alert(
        'Order Processing Error',
        error.message || 'An error occurred while processing your order',
        [
          { text: 'Try Again' },
          { text: 'Go to Home', onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'BuyerHome' }],
          })}
        ]
      );
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart appears to be empty. Please add items before completing checkout.');
      }
      
      const paymentReference = response?.data?.transactionRef?.reference || 
                             response?.transactionRef?.reference || 
                             response?.reference;
      
      if (!paymentReference) {
        throw new Error('No payment reference received from Paystack');
      }
      
      const formattedOrderItems = cartItems.map(item => ({
        productId: item.product?._id || item._id || item.productId,
        name: item.product?.name || item.name,
        price: item.product?.price || item.price,
        quantity: item.quantity,
        image: item.product?.image || item.image,
        sellerId: item.product?.seller || item.seller || item.sellerId
      }));
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');
      
      let locationValue = shippingDetails?.shippingAddress?.location || '';
      const validLocations = [
        'OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 
        'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 
        'ATL', 'OGUAA', 'KNH'
      ];
      
      if (locationValue && !validLocations.includes(locationValue)) {
        const normalizedLocation = locationValue.toUpperCase();
        if (validLocations.includes(normalizedLocation)) {
          locationValue = normalizedLocation;
        }
      }

      if (!locationValue || !validLocations.includes(locationValue)) {
        throw new Error('Invalid delivery location. Please go back and select from the available locations.');
      }
      
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
        throw new Error(responseData.message || 'Failed to create order');
      }
      
      const orderNumber = responseData._id.substring(responseData._id.length - 6).toUpperCase();
      
      await handleOrderPlacedNotification(orderNumber);
      await handlePaymentSuccessfulNotification(
        orderNumber,
        `Thank you for your purchase! Your payment of GHS ${amount} has been confirmed.`
      );
      
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
      
      dispatch(clearCart());
      
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
      Alert.alert(
        'Order Processing Error',
        error.message || 'An error occurred while processing your order',
        [
          { text: 'Try Again' },
          { text: 'Go to Home', onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'BuyerHome' }],
          })}
        ]
      );
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

  if (!paymentMethod) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.pageTitle}>Choose Payment Method</Text>
          <Text style={styles.amountText}>Total: GHS {(amount).toFixed(2)}</Text>
          
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
              setPaymentMethod('pay_on_delivery');
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

  if (paymentMethod === 'pay_on_delivery' && isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Paystack
        paystackKey={PAYSTACK_PUBLIC_KEY}
        amount={amount}
        billingEmail={email}
        billingName="Customer"
        activityIndicatorColor="#5D3FD3"
        onCancel={handlePaymentCancel}
        onSuccess={handlePaymentSuccess}
        autoStart={true}
        channels={["card", "bank", "ussd", "qr", "mobile_money"]}
        currency="GHS"
        reference={`order_${Date.now()}_${Math.floor(Math.random() * 1000)}`}
        refundable={true}
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
    backgroundColor: '#fff',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorSubText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666'
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