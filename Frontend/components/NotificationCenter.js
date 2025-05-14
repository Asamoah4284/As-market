import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  Animated, 
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { markNotificationAsRead, markAllNotificationsAsRead, clearNotifications, setNotifications } from '../store/slices/notificationSlice';
import { NotificationTypes, fetchNotifications, markNotificationAsReadOnServer, markAllNotificationsAsReadOnServer } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

const NotificationCenter = ({ visible, onClose, navigation, isAdmin = false }) => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notifications);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Filter notifications based on admin status
  const filteredNotifications = isAdmin ? 
    notifications.filter(notification => 
      notification.data?.type === NotificationTypes.ADMIN_PAYMENT_RECEIVED
    ) : 
    notifications;
  
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNotificationPress = (notification) => {
    dispatch(markNotificationAsRead(notification.id));
    
    // Navigate based on notification type
    switch (notification.data?.type) {
      case NotificationTypes.ADD_TO_CART:
        navigation.navigate('Cart');
        break;
      case NotificationTypes.ORDER_PLACED:
      case NotificationTypes.PAYMENT_SUCCESSFUL:
        navigation.navigate('Profile', { initialTab: 'orders' });
        break;
      case NotificationTypes.NEW_PRODUCT:
        if (notification.data.productId) {
          navigation.navigate('ProductDetails', { productId: notification.data.productId });
        }
        break;
      case NotificationTypes.ADMIN_PAYMENT_RECEIVED:
        // Navigate to Orders section in Admin dashboard
        navigation.navigate('Admin', { section: 'orders', filter: 'All Orders' });
        break;
      default:
        break;
    }
    
    onClose();
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Format date
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, item.read && styles.readNotification]} 
        onPress={() => handleNotificationPress(item)}
      >
        {!item.read && <View style={styles.unreadIndicator} />}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#f8f8f8" barStyle="dark-content" />
        <Animated.View 
          style={[
            styles.container, 
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {filteredNotifications.length > 0 ? (
            <>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllAsRead}>
                  <Text style={styles.actionText}>Mark all as read</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleClearAll}>
                  <Text style={styles.actionText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={filteredNotifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.notificationList}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    color: '#5D3FD3',
    fontSize: 15,
    fontWeight: '500',
  },
  notificationList: {
    padding: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  readNotification: {
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5D3FD3',
    marginTop: 6,
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default NotificationCenter; 