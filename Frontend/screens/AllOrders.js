import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert(
          'Error',
          'Authentication required. Please login again.',
          [{ text: 'OK' }]
        );
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      let errorMessage = 'Failed to fetch orders. Please try again later.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view all orders.';
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert(
          'Error',
          'Authentication required. Please login again.',
          [{ text: 'OK' }]
        );
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (response.data) {
        // TODO: Navigate to order details screen
        console.log('Order details:', response.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      let errorMessage = 'Failed to fetch order details. Please try again later.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view this order.';
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpdateStatus = async (orderId) => {
    try {
      // TODO: Implement status update modal or screen
      console.log('Updating status for order:', orderId);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert(
        'Error',
        'Failed to update order status. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#666';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#0066cc';
      case 'delivered':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item._id}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.orderStatus) }]}>
          {item.orderStatus || 'Unknown'}
        </Text>
      </View>
      <Text style={styles.customerName}>{item.user?.name || 'Unknown Customer'}</Text>
      <View style={styles.orderDetails}>
        <Text style={styles.date}>Date: {formatDate(item.createdAt)}</Text>
        <Text style={styles.total}>Total: ${item.totalAmount?.toFixed(2) || '0.00'}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewDetails(item._id)}
        >
          <MaterialIcons name="visibility" size={20} color="#0066cc" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUpdateStatus(item._id)}
        >
          <MaterialIcons name="edit" size={20} color="#0066cc" />
          <Text style={styles.actionText}>Update Status</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchOrders}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '40%',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  total: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    color: '#0066cc',
    fontSize: 14,
  },
});

export default AllOrders; 