import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from '../store/slices/notificationSlice';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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
    
    // Only run on real devices, not in Expo Go
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices, not in Expo Go');
      return null;
    }
    
    // Additional check for Expo Go
    if (Constants.appOwnership === 'expo') {
      console.log('Push notifications disabled in Expo Go. Please use your published app.');
      return null;
    }
    
    // Check if we're in development mode with Expo Go
    if (__DEV__ && Constants.appOwnership === 'expo') {
      console.log('Development mode with Expo Go detected. Push notifications will not work.');
      return null;
    }
    
    console.log('App ownership:', Constants.appOwnership);
    console.log('Is device:', Device.isDevice);
    console.log('Platform:', Platform.OS);
    
    if (Platform.OS === 'android') {
      console.log('Setting up Android notification channel');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Asarion Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5D3FD3',
        sound: true,
        enableLights: true,
        enableVibrate: true,
      });
      console.log('Android notification channel set up');
    }

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
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found');
        return null;
      }
      
      token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      console.log('Received token:', token?.data ? (token.data.substring(0, 10) + '...') : 'null');
      
      // Save token to AsyncStorage for future use
      if (token) {
        await AsyncStorage.setItem('pushToken', token.data);
        console.log('Token saved to AsyncStorage');
        
        // Send token to backend if user is logged in
        const authToken = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (authToken && userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            const userId = userData.id;
            
            if (userId) {
              await axios.post(
                `${API_BASE_URL}/api/users/push-token`,
                { 
                  userId, 
                  pushToken: token.data 
                },
                {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                  },
                }
              );
              console.log('Push token saved to backend successfully');
            } else {
              console.error('User ID not found in userData');
            }
          } catch (error) {
            console.error('Error saving push token to backend:', error.response?.data || error.message);
          }
        } else {
          console.log('User not logged in, push token will be sent after login');
        }
      }
    } catch (tokenError) {
      console.error('Error getting push token:', tokenError);
    }

    return token?.data;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

// Register push token for logged-in user
export async function registerPushTokenForUser(userId, authToken) {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices, not in Expo Go');
      return false;
    }

    // Additional check for Expo Go
    if (Constants.appOwnership === 'expo') {
      console.log('Push notifications disabled in Expo Go. Please use your published app.');
      return false;
    }
    
    console.log('🔔 Registering push token for user:', userId);
    console.log('📱 App ownership:', Constants.appOwnership);
    console.log('🏗️ App name:', Constants.expoConfig?.name || 'Unknown');

    // Get the stored push token
    const pushToken = await AsyncStorage.getItem('pushToken');
    
    if (!pushToken) {
      console.log('No push token found, registering for notifications first');
      const newToken = await registerForPushNotificationsAsync();
      if (!newToken) {
        console.log('Failed to get push token');
        return false;
      }
      // The registerForPushNotificationsAsync function will handle sending to backend
      return true;
    }

    // Send existing token to backend
    try {
      console.log('📤 Sending push token to backend for user:', userId);
      console.log('🔑 Push token preview:', pushToken.substring(0, 20) + '...');
      
      await axios.post(
        `${API_BASE_URL}/api/users/push-token`,
        { 
          userId, 
          pushToken 
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log('✅ Push token registered successfully for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error registering push token for user:', error.response?.data || error.message);
      return false;
    }
  } catch (error) {
    console.error('Error in registerPushTokenForUser:', error);
    return false;
  }
}

// Send local notification
export async function sendLocalNotification(title, body, data = {}) {
  try {
    console.log('Attempting to send notification:', { title, body, data });
    
    // For Android, ensure notification channel is set with highest priority
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX, // Maximum importance
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5D3FD3',
        sound: true,
        enableLights: true,
        enableVibrate: true,
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
        sound: 'default',
        priority: 'max',
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
// Add debounce tracking to prevent duplicate notifications
let lastNotificationTimestamp = 0;
const NOTIFICATION_DEBOUNCE_TIME = 2000; // 2 seconds

export const handleAddToCartNotification = async (productName, dispatch) => {
  try {
    // Check if notification was recently sent
    const now = Date.now();
    if (now - lastNotificationTimestamp < NOTIFICATION_DEBOUNCE_TIME) {
      console.log('Notification debounced - recent notification exists');
      return false;
    }
    
    // Update timestamp
    lastNotificationTimestamp = now;
    
    // Generate a unique notification ID
    const uniqueId = `${now}-${Math.floor(Math.random() * 10000)}`;
    
    // Explicitly send a local notification for add to cart actions
    // This ensures the user always sees a notification
    const notificationId = await sendLocalNotification(
      'Item Added to Cart',
      `You've added ${productName} to your cart.`,
      { type: NotificationTypes.ADD_TO_CART }
    );
    
    // If dispatch is provided, only update Redux store
    // Don't add another notification to the store since the system will
    // already capture the local notification we just sent
    if (dispatch) {
      dispatch(addNotification({
        id: uniqueId,
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

export const handlePaymentSuccessfulNotification = (orderNumber, customMessage = null, isPayOnDelivery = false) => {
  let defaultMessage;
  let title;
  
  if (isPayOnDelivery) {
    title = 'Pay on Delivery Order';
    defaultMessage = `Your order #${orderNumber} has been confirmed. Payment will be collected upon delivery.`;
  } else {
    title = 'Order Confirmation';
    defaultMessage = `Your payment for order #${orderNumber} has been processed successfully.`;
  }
  
  const message = customMessage || defaultMessage;
  
  return sendLocalNotification(
    title,
    message,
    { 
      type: NotificationTypes.PAYMENT_SUCCESSFUL,
      isPayOnDelivery: isPayOnDelivery 
    }
  );
};

export const handleNewProductNotification = (productName, sellerName) => {
  return sendLocalNotification(
    'New Product Available',
    `${sellerName} just added a new product: ${productName}`,
    { type: NotificationTypes.NEW_PRODUCT }
  );
};

export const handleAdminPaymentReceivedNotification = async (orderNumber, amount, customTitle = null) => {
  const title = customTitle || 'Payment Received';
  const body = `Payment of GHS${amount} received for order #${orderNumber}`;
  
  try {
    // First, try to create a notification via the backend API's public endpoint
    console.log('Attempting to send admin notification through public endpoint');
    
    try {
      console.log('Sending admin notification to API with data:', { 
        recipient: 'admin', 
        title, 
        body, 
        type: NotificationTypes.ADMIN_PAYMENT_RECEIVED 
      });
      
      // Use the public endpoint that doesn't require authorization
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/admin-notification`,
        {
          recipient: 'admin',
          title,
          body,
          type: NotificationTypes.ADMIN_PAYMENT_RECEIVED,
          data: { orderNumber, amount }
        }
      );
      console.log('Admin notification created via public API, response:', response.status);
      return true;
    } catch (error) {
      console.error('Error creating admin notification via public API:', error.message);
      if (error.response) {
        console.error('API Error response data:', error.response.data);
        console.error('API Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      
      // Try with authentication as fallback
      console.log('Trying with authenticated endpoint as fallback');
      const authToken = await AsyncStorage.getItem('userToken');
      
      if (authToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/notifications`,
            {
              recipient: 'admin',
              title,
              body,
              type: NotificationTypes.ADMIN_PAYMENT_RECEIVED,
              data: { orderNumber, amount }
            },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          console.log('Admin notification created via authenticated API, response:', response.status);
          return true;
        } catch (error) {
          console.error('Error creating admin notification via authenticated API:', error.message);
          // If API call fails, fall back to local notification
        }
      }
    }
    
    // Fallback: send a local notification
    console.log('Falling back to local notification for admin');
    return sendLocalNotification(
      title,
      body,
      { type: NotificationTypes.ADMIN_PAYMENT_RECEIVED, orderNumber, amount }
    );
  } catch (error) {
    console.error('Error in handleAdminPaymentReceivedNotification:', error.message, error.stack);
    return false;
  }
};

// Fetch notifications from backend
export async function fetchNotifications(recipient = 'user') {
  try {
    const authToken = await AsyncStorage.getItem('userToken');
    
    if (!authToken) {
      console.log('No auth token found, cannot fetch notifications');
      return [];
    }
    
    const response = await axios.get(
      `${API_BASE_URL}/api/notifications/${recipient}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Mark notification as read on backend
export async function markNotificationAsReadOnServer(notificationId) {
  try {
    const authToken = await AsyncStorage.getItem('userToken');
    
    if (!authToken) {
      console.log('No auth token found, cannot mark notification as read');
      return false;
    }
    
    await axios.put(
      `${API_BASE_URL}/api/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Mark all notifications as read on backend
export async function markAllNotificationsAsReadOnServer(recipient = 'user') {
  try {
    const authToken = await AsyncStorage.getItem('userToken');
    
    if (!authToken) {
      console.log('No auth token found, cannot mark all notifications as read');
      return false;
    }
    
    await axios.put(
      `${API_BASE_URL}/api/notifications/${recipient}/read-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
} 