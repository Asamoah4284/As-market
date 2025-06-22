import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';

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