import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { 
  handlePaymentSuccessfulNotification, 
  handleAdminPaymentReceivedNotification 
} from '../services/notificationService';

const PaymentSuccessScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const isProcessing = route.params?.isProcessing || false;
  const payOnDelivery = route.params?.payOnDelivery || false;
  const customMessage = route.params?.message || (
    payOnDelivery
      ? "Your order has been placed successfully. You will pay when your order is delivered."
      : "Thank you for your purchase. Your order has been successfully placed and will be processed shortly."
  );
  const orderNumber = route.params?.orderNumber || Math.floor(100000 + Math.random() * 900000);
  const totalAmount = route.params?.totalAmount || 0;

  // Prevent going back with hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  // Send notifications when payment is successful
  useEffect(() => {
    // Send notification to user - different message for pay on delivery
    if (payOnDelivery) {
      handlePaymentSuccessfulNotification(orderNumber, "Your order has been placed! You'll pay on delivery.");
    } else {
      handlePaymentSuccessfulNotification(orderNumber);
    }
    
    // Send notification to admin with different message for pay on delivery
    if (payOnDelivery) {
      handleAdminPaymentReceivedNotification(orderNumber, totalAmount, "New order with Pay on Delivery");
    } else {
      handleAdminPaymentReceivedNotification(orderNumber, totalAmount);
    }
  }, []);

  const handleContinueShopping = () => {
    dispatch(clearCart());
    navigation.reset({
      index: 0,
      routes: [{ name: 'BuyerHome' }],
    });
  };

  const handleViewOrders = () => {
    dispatch(clearCart());
    navigation.reset({
      index: 1,
      routes: [
        { name: 'BuyerHome' },
        { name: 'Profile', params: { initialTab: 'orders' } },
      ],
    });
  };

  const getScreenTitle = () => {
    if (payOnDelivery) {
      return "Order Placed!";
    } else if (isProcessing) {
      return "Payment Successful - Processing Order";
    } else {
      return "Payment Successful!";
    }
  };

  const getIconName = () => {
    if (payOnDelivery) {
      return "bicycle";
    } else if (isProcessing) {
      return "time";
    } else {
      return "checkmark-circle";
    }
  };

  const getIconColor = () => {
    if (payOnDelivery) {
      return "#5D3FD3";
    } else if (isProcessing) {
      return "#FFA500";
    } else {
      return "#4CAF50";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getIconName()} 
            size={100} 
            color={getIconColor()} 
          />
        </View>
        
        <Text style={styles.title}>
          {getScreenTitle()}
        </Text>
        
        <Text style={styles.message}>
          {customMessage}
        </Text>

        <View style={styles.infoContainer}>
          <Ionicons name="mail-outline" size={24} color="#666" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            A confirmation email will be sent to your registered email address.
          </Text>
        </View>

        {payOnDelivery && (
          <View style={styles.infoContainer}>
            <Ionicons name="cash-outline" size={24} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Please ensure you have the exact amount ready when your order is delivered.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleContinueShopping}
        >
          <Text style={styles.buttonText}>Continue Shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleViewOrders}
        >
          <Text style={[styles.buttonText, styles.outlineButtonText]}>View Orders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5D3FD3',
  },
  outlineButtonText: {
    color: '#5D3FD3',
  },
});

export default PaymentSuccessScreen; 