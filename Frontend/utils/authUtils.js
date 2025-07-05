import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { registerPushTokenForUser } from '../services/notificationService';

// Function to prompt login if user is not authenticated
export const requireAuthentication = async (navigation, actionType) => {
  // Get authentication status from store or AsyncStorage
  let token = store.getState().auth?.token;
  
  // If token isn't in Redux state, check AsyncStorage
  if (!token) {
    token = await AsyncStorage.getItem('userToken');
  }
  
  if (!token) {
    Alert.alert(
      'Authentication Required',
      `Please log in or sign up to ${actionType}.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Login',
          onPress: () => navigation.navigate('Login')
        },
        {
          text: 'Sign Up',
          onPress: () => navigation.navigate('SignUp')
        }
      ]
    );
    return false;
  }
  return true;
};

// Function to register push token after successful login
export const registerPushTokenAfterLogin = async (userId, authToken) => {
  try {
    console.log('Registering push token after login for user:', userId);
    await registerPushTokenForUser(userId, authToken);
    console.log('Push token registration completed');
  } catch (error) {
    console.error('Error registering push token after login:', error);
  }
};