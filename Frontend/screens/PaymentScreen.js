import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { clearCart } from '../store/slices/cartSlice';
import { API_ENDPOINTS } from '../config/api';

const PAYSTACK_PUBLIC_KEY = 'pk_test_adab0e58f74cc222a31e9e82a291ae8de3952848';

const PaymentScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector(state => state.cart);
  const { amount } = route.params;

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setEmail(userData.email);
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    getUserEmail();
  }, []);

  const createOrder = async (reference) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Creating order with token:', token ? 'Token exists' : 'No token');
      
      // Prepare order items from cart
      const orderItems = cartItems.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }));

      console.log('Order items prepared:', orderItems);
      console.log('Payment amount (pesewas):', amount);
      console.log('Payment reference:', reference);

      // Send the actual amount in GHS to the backend
      const response = await axios.post(
        API_ENDPOINTS.CREATE_ORDER,
        {
          paymentReference: reference,
          items: orderItems,
          totalAmount: amount ,
          paymentStatus: 'success'
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      console.log('Order created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Order creation error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('The order request timed out. Your payment was successful, and your order will be processed shortly.');
      }
      const errorMessage = error.response?.data?.message || 'Error processing order';
      throw new Error(errorMessage);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      console.log('Payment successful, full response:', response);
      
      // Extract payment reference from Paystack response
      const paymentReference = response?.data?.transactionRef?.reference || 
                             response?.transactionRef?.reference || 
                             response?.reference;
      
      if (!paymentReference) {
        console.error('Payment response structure:', response);
        throw new Error('No payment reference received from Paystack');
      }

      console.log('Creating order with payment reference:', paymentReference);
      await createOrder(paymentReference);
      
      dispatch(clearCart());
      navigation.reset({
        index: 0,
        routes: [{ name: 'PaymentSuccess' }],
      });
    } catch (error) {
      console.error('Error in handlePaymentSuccess:', error);
      
      if (error.message.includes('timed out')) {
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
              text: 'Contact Support',
              onPress: () => navigation.navigate('Support')
            },
            {
              text: 'View Orders',
              onPress: () => navigation.reset({
                index: 1,
                routes: [
                  { name: 'BuyerHome' },
                  { name: 'Profile', params: { initialTab: 'orders' } }
                ],
              })
            }
          ]
        );
      }
    }
  };

  const handlePaymentCancel = () => {
    navigation.goBack();
  };

  if (!email) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Paystack
        paystackKey={PAYSTACK_PUBLIC_KEY}
        amount={amount} // Amount is already in pesewas, don't multiply
        billingEmail={email}
        activityIndicatorColor="#5D3FD3"
        onCancel={handlePaymentCancel}
        onSuccess={handlePaymentSuccess}
        autoStart={true}
        channels={["card", "bank", "ussd", "qr", "mobile_money"]}
        currency="GHS"
        reference={`ref_${Date.now()}`}
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
  }
});

export default PaymentScreen; 