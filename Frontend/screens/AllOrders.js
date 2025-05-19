import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

      console.log(`Fetching order details for ID: ${orderId}`);
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.data && 
          (Array.isArray(response.data) && response.data.length === 0 || 
           !response.data._id)) {
        console.log('No valid order data received:', response.data);
        Alert.alert(
          'Error',
          'No order details available for this ID',
          [{ text: 'OK' }]
        );
        return;
      }

      if (response.data) {
        console.log('Order details received:', response.data);
        setSelectedOrder(response.data);
        setModalVisible(true);
      } else {
        console.log('No data received from the API');
        Alert.alert(
          'Error',
          'No order details available',
          [{ text: 'OK' }]
        );
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
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
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
      {/* Seller Phones Section */}
      {Array.isArray(item.items) && item.items.length > 0 && (
        <View style={styles.sellerPhonesSection}>
          <Text style={styles.sellerPhonesTitle}>Seller Phone(s):</Text>
          {item.items.map((orderItem, idx) => (
            <Text key={idx} style={styles.sellerPhoneText}>
             {orderItem.sellerPhone}
            </Text>
          ))}
        </View>
      )}
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

  const renderOrderDetailsModal = () => {
    
    const item = selectedOrder;
    if (!item) return null;

    // Debug the data structure
    console.log('Selected Order Data:', JSON.stringify(item));
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)} 
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Order Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>{item._id || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(item.orderStatus) }]}>
                    {item.orderStatus || 'Unknown'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>
                    {typeof item.totalAmount === 'number' ? `$${item.totalAmount.toFixed(2)}` : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Buyer Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User ID:</Text>
                  <Text style={styles.detailValue}>
                    {item.user?._id || (typeof item.user === 'string' ? item.user : 'N/A')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{item.user?.name || 'Unknown'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{item.buyerContact?.phone || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alternative Phone:</Text>
                  <Text style={styles.detailValue}>{item.buyerContact?.alternativePhone || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Shipping Address</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{item.shippingAddress?.location || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Room Number:</Text>
                  <Text style={styles.detailValue}>{item.shippingAddress?.roomNumber || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Additional Info:</Text>
                  <Text style={styles.detailValue}>{item.shippingAddress?.additionalInfo || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Date:</Text>
                  <Text style={styles.detailValue}>
                    {item.shippingAddress?.preferredDeliveryDay 
                      ? formatDate(item.shippingAddress.preferredDeliveryDay)
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>{item.paymentInfo?.reference || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>{item.paymentInfo?.status || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>
                    {item.paymentInfo?.amount 
                      ? `${item.paymentInfo.currency || 'GHS'} ${item.paymentInfo.amount.toFixed(2)}`
                      : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{item.paymentInfo?.paymentMethod || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid At:</Text>
                  <Text style={styles.detailValue}>
                    {item.paymentInfo?.paidAt ? formatDate(item.paymentInfo.paidAt) : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Items</Text>
                {Array.isArray(item.items) && item.items.map((orderItem, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Item {index + 1}:</Text>
                      <Text style={styles.detailValue}>{orderItem.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Product ID:</Text>
                      <Text style={styles.detailValue}>{orderItem.product}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantity:</Text>
                      <Text style={styles.detailValue}>{orderItem.quantity}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price:</Text>
                      <Text style={styles.detailValue}>${orderItem.price?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Seller ID:</Text>
                      <Text style={styles.detailValue}>{orderItem.sellerId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Seller Phone:</Text>
                      <Text style={styles.detailValue}>{orderItem.sellerPhone || 'N/A'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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
      {renderOrderDetailsModal()}
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
  sellerPhonesSection: {
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    padding: 8,
  },
  sellerPhonesTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 13,
    marginBottom: 2,
  },
  sellerPhoneText: {
    fontSize: 13,
    color: '#444',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: '40%',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    width: '60%',
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
});

export default AllOrders; 