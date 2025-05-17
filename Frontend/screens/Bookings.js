import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to view your bookings');
        navigation.navigate('Login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }
      
      // Remove the cancelled booking from state
      setBookings(bookings.filter(booking => booking._id !== bookingId));
      Alert.alert('Success', 'Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed':
        return '#4ECDC4';
      case 'pending':
        return '#FFD166';
      case 'completed':
        return '#5D3FD3';
      case 'cancelled':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.service?.name || 'Service'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => navigation.navigate('BookingDetails', { bookingId: item._id })}
        >
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.bookingDate)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.service?.seller?.name || 'Service Provider'}
          </Text>
        </View>
        
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            GH¢{item.service?.price?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>
      
      <View style={styles.bookingActions}>
        {item.status !== 'cancelled' && item.status !== 'completed' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                'Cancel Booking',
                'Are you sure you want to cancel this booking?',
                [
                  {
                    text: 'No',
                    style: 'cancel'
                  },
                  {
                    text: 'Yes, Cancel',
                    onPress: () => cancelBooking(item._id)
                  }
                ]
              );
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('ServiceDetails', { serviceId: item.service?._id })}
        >
          <Text style={styles.viewButtonText}>View Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF4757" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchBookings}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5D3FD3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={fetchBookings}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.container}>
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubText}>
              Your service bookings will appear here
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.navigate('BuyerHome')}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bookingsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#5D3FD3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5D3FD3',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bookingsList: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 4,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Bookings; 