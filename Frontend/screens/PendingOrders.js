import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      // Simulated API call
      setTimeout(() => {
        setOrders([
          { id: '3', customer: 'Bob Johnson', total: 200.00, status: 'Pending', date: '2024-03-13' },
          { id: '4', customer: 'Alice Brown', total: 125.75, status: 'Pending', date: '2024-03-12' },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    // TODO: Implement approve order functionality
    console.log('Approving order:', orderId);
  };

  const handleRejectOrder = async (orderId) => {
    // TODO: Implement reject order functionality
    console.log('Rejecting order:', orderId);
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <Text style={[styles.status, { color: '#FFA500' }]}>Pending</Text>
      </View>
      <Text style={styles.customerName}>{item.customer}</Text>
      <View style={styles.orderDetails}>
        <Text style={styles.date}>Date: {item.date}</Text>
        <Text style={styles.total}>Total: ${item.total.toFixed(2)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="visibility" size={20} color="#0066cc" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleApproveOrder(item.id)}
        >
          <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={[styles.actionText, { color: '#4CAF50' }]}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleRejectOrder(item.id)}
        >
          <MaterialIcons name="cancel" size={20} color="#F44336" />
          <Text style={[styles.actionText, { color: '#F44336' }]}>Reject</Text>
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
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
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
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
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

export default PendingOrders; 