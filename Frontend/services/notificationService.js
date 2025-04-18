import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from '../store/slices/notificationSlice';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Get Expo push token
export async function registerForPushNotificationsAsync() {
  let token;
  
  try {
    console.log('Starting push notification registration');
    
    if (Platform.OS === 'android') {
      console.log('Setting up Android notification channel');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Asarion Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5D3FD3',
      });
      console.log('Android notification channel set up');
    }

    if (Device.isDevice) {
      console.log('Checking existing notification permissions');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('Permission not granted, requesting permissions');
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
            allowProvisional: true,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
        console.log('New permission status after request:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token: Permission denied');
        return null;
      }
      
      console.log('Getting Expo push token');
      
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        
        console.log('Received token:', token?.data ? (token.data.substring(0, 10) + '...') : 'null');
        
        // Save token to AsyncStorage for future use
        if (token) {
          await AsyncStorage.setItem('pushToken', token.data);
          console.log('Token saved to AsyncStorage');
        }
      } catch (tokenError) {
        console.error('Error getting push token:', tokenError);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token?.data;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

// Send local notification
export async function sendLocalNotification(title, body, data = {}) {
  try {
    console.log('Attempting to send notification:', { title, body, data });
    
    // For Android, ensure notification channel is set
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4757',
      });
    }
    
    // Ensure we have notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.error('Notification permission denied');
        return false;
      }
    }
    
    // Create the notification with maximum visibility
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        badge: 1,
        color: '#5D3FD3',
        // Add specific Android configuration
        android: {
          channelId: 'default',
          priority: 'max', // PRIORITY_MAX
          sticky: false,
          color: '#5D3FD3',
          vibrationPattern: [0, 250, 250, 250],
        },
        // Add iOS-specific configuration
        ios: {
          sound: true,
          _displayInForeground: true,
        }
      },
      trigger: null, // Show immediately
    });
    
    console.log('Notification sent successfully with ID:', notificationId);
    
    // Update badge count
    if (Platform.OS === 'ios') {
      const currentBadgeCount = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(currentBadgeCount + 1);
    }
    
    return notificationId;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Types of notifications
export const NotificationTypes = {
  ADD_TO_CART: 'ADD_TO_CART',
  ORDER_PLACED: 'ORDER_PLACED',
  PAYMENT_SUCCESSFUL: 'PAYMENT_SUCCESSFUL',
  NEW_PRODUCT: 'NEW_PRODUCT',
  ADMIN_PAYMENT_RECEIVED: 'ADMIN_PAYMENT_RECEIVED',
};

// Create notification handlers for different types
export const handleAddToCartNotification = async (productName, dispatch) => {
  try {
    const notificationId = await sendLocalNotification(
      'Item Added to Cart',
      `You've added ${productName} to your cart.`,
      { type: NotificationTypes.ADD_TO_CART }
    );
    
    // If dispatch is provided, also update Redux store directly
    // This ensures the notification appears in the UI immediately
    if (dispatch) {
      dispatch(addNotification({
        id: notificationId || Date.now().toString(),
        title: 'Item Added to Cart',
        body: `You've added ${productName} to your cart.`,
        data: { type: NotificationTypes.ADD_TO_CART },
        timestamp: new Date().toISOString(),
        read: false
      }));
    }
    
    return notificationId;
  } catch (error) {
    console.error('Error in handleAddToCartNotification:', error);
    return false;
  }
};

export const handleOrderPlacedNotification = (orderNumber) => {
  return sendLocalNotification(
    'Order Placed',
    `Your order #${orderNumber} has been placed successfully.`,
    { type: NotificationTypes.ORDER_PLACED }
  );
};

export const handlePaymentSuccessfulNotification = (orderNumber, customMessage = null) => {
  const defaultMessage = `Your payment for order #${orderNumber} has been processed successfully.`;
  const message = customMessage || defaultMessage;
  
  return sendLocalNotification(
    'Order Confirmation',
    message,
    { type: NotificationTypes.PAYMENT_SUCCESSFUL }
  );
};

export const handleNewProductNotification = (productName, sellerName) => {
  return sendLocalNotification(
    'New Product Available',
    `${sellerName} just added a new product: ${productName}`,
    { type: NotificationTypes.NEW_PRODUCT }
  );
};

export const handleAdminPaymentReceivedNotification = (orderNumber, amount, customTitle = null) => {
  const title = customTitle || 'Payment Received';
  
  return sendLocalNotification(
    title,
    `Payment of $${amount} received for order #${orderNumber}`,
    { type: NotificationTypes.ADMIN_PAYMENT_RECEIVED }
  );
}; 