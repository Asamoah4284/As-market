import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderSuccessScreen = ({ navigation, route }) => {
  // Get order information from route params if available
  const { orderNumber, amount } = route.params || {};
  
  return (
    <View style={styles.container}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
      </View>
      <Text style={styles.title}>Order Successful!</Text>
      
      {orderNumber && (
        <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
      )}
      
      {amount && (
        <Text style={styles.amount}>Amount: GHS {amount}</Text>
      )}
      
      <Text style={styles.message}>
        Thank you for your purchase. Your order has been successfully placed.
        We've sent you a notification with all the details.
      </Text>
      
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => navigation.navigate('NotificationCenter')}
      >
        <Ionicons name="notifications" size={20} color="#5D3FD3" />
        <Text style={styles.notificationText}>View Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('BuyerHome')}
      >
        <Text style={styles.buttonText}>Continue Shopping</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.outlineButton]}
        onPress={() => navigation.navigate('Profile', { initialTab: 'orders' })}
      >
        <Text style={[styles.buttonText, styles.outlineButtonText]}>View Orders</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D3FD3',
    marginBottom: 5,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0ebff',
  },
  notificationText: {
    color: '#5D3FD3',
    fontWeight: '600',
    marginLeft: 5,
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

export default OrderSuccessScreen; 