import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store/store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { setPushToken, addNotification } from './store/slices/notificationSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AIProductSearch from './screens/AIProductSearch';
import BuyerHomeScreen from './screens/BuyerHomeScreen';
import BuyerProfileScreen from './screens/BuyerprofileScreen';
import CartScreen from './screens/CartScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import Categories from './screens/Categories';  
import CategoryScreen from './screens/CategoriesScreen';
import SellerDashboardScreen from './screens/SellerDashboardScreen';
import SellerProfileScreen from './screens/SellerProfileScreen';
import Admin from './screens/Admin';
import CheckoutForm from './screens/CheckoutForm';

import PaymentScreen from './screens/PaymentScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import { Platform, Alert, Text, View, Button } from 'react-native';
import PromoteStoreScreen from './screens/PromoteStoreScreen';
import Bookings from './screens/Bookings';
import ServiceBooking from './screens/ServiceBooking';
import ServiceDetails from './screens/ServiceDetails';

const Stack = createStackNavigator();

// Create a navigation reference that can be used outside of components
export const navigationRef = React.createRef();

export function navigate(name, params) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  }
}

// Function to check if user needs to see onboarding
export const checkOnboardingStatus = async () => {
  try {
    const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
    return onboardingCompleted === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

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

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Function to send push notifications
export async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Asarion Marketplace',
    body: 'New notification from Asarion Marketplace!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage) {
  console.error(errorMessage);
  Alert.alert('Notification Error', errorMessage);
}

// Updated registration function for push notifications
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found');
      return;
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('Push token:', pushTokenString);
      return pushTokenString;
    } catch (e) {
      console.error(`Error getting push token: ${e}`);
      return;
    }
  } else {
    console.log('Must use physical device for push notifications');
    return;
  }
}

function AppContent() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(undefined);
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();
  const dispatch = useDispatch();

  // Deep link handling
  const handleDeepLink = (url) => {
    console.log('Deep link received:', url);
    
    if (url) {
      const parsedUrl = Linking.parse(url);
      console.log('Parsed URL:', parsedUrl);
      
      if (parsedUrl.hostname === 'reset-password') {
        const token = parsedUrl.queryParams?.token;
        if (token) {
          console.log('Navigating to ResetPassword with token:', token);
          navigate('ResetPassword', { token });
        } else {
          console.log('No token found in reset password link');
          Alert.alert('Invalid Link', 'The password reset link is invalid. Please request a new one.');
        }
      } else if (parsedUrl.hostname === 'product') {
        const productId = parsedUrl.queryParams?.id;
        if (productId) {
          console.log('Navigating to ProductDetails with productId:', productId);
          navigate('ProductDetails', { productId });
        } else {
          console.log('No product ID found in product link');
          Alert.alert('Invalid Link', 'The product link is invalid.');
        }
      }
    }
  };

  useEffect(() => {
    // Check if onboarding is completed
    const checkInitialRoute = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        if (onboardingCompleted === 'true') {
          setInitialRoute('BuyerHome');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking initial route:', error);
        setIsLoading(false);
      }
    };

    checkInitialRoute();

    // Handle initial deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Register for push notifications
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          dispatch(setPushToken(token));
        }
      })
      .catch(error => console.error('Error registering for push notifications:', error));

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while app in foreground:', notification);
      setNotification(notification);
      try {
        const { title, body, data } = notification.request.content;
        
        // Dispatch to Redux store
        dispatch(addNotification({ 
          title, 
          body, 
          data,
          id: notification.request.identifier || Date.now().toString(), 
          timestamp: new Date().toISOString()
        }));
        
        // Set badge count on app icon
        if (Platform.OS === 'ios') {
          Notifications.setBadgeCountAsync(1);
        }
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
      try {
        const { title, body, data } = response.notification.request.content;
        
        // Dispatch to Redux store and mark as read since user tapped on it
        const notificationId = response.notification.request.identifier || Date.now().toString();
        
        dispatch(addNotification({ 
          title, 
          body, 
          data,
          id: notificationId,
          timestamp: new Date().toISOString(),
          read: true // Mark as read since user tapped it
        }));
        
        // Clear badge count when user interacts with notification
        if (Platform.OS === 'ios') {
          Notifications.setBadgeCountAsync(0);
        }
        
        // Handle navigation based on notification type
        if (data?.type === 'ADD_TO_CART') {
          // Navigate to cart
          navigate('Cart');
        }
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    });

    return () => {
      subscription?.remove();
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [dispatch]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer 
        ref={navigationRef}
        linking={{
          prefixes: ['asarion://'],
          config: {
            screens: {
              ResetPassword: 'reset-password',
              ProductDetails: 'product',
            },
          },
        }}
      >
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="BuyerHome" component={BuyerHomeScreen} />
          <Stack.Screen 
            name="Admin" 
            component={Admin}
            options={{
              headerShown: false,
              gestureEnabled: false,
              animationEnabled: true,
              animation: 'fade',
              freezeOnBlur: true
            }}
          />
          <Stack.Screen 
            name="Checkout" 
            component={CheckoutForm}
            options={{
              title: 'Checkout',
              headerShown: true,
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTintColor: '#333',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }} 
          />
          <Stack.Screen name="Profile" component={BuyerProfileScreen} />
          <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
          <Stack.Screen 
            name="ProductDetails" 
            component={ProductDetailsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="AIProductSearch" component={AIProductSearch} />
          <Stack.Screen name="Categories" component={Categories} />
          <Stack.Screen name="CategoriesScreen" component={CategoryScreen} />

          <Stack.Screen name="Bookings" component={Bookings} />
          <Stack.Screen name="ServiceBooking" component={ServiceBooking} />
          <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
          <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />

          <Stack.Screen name="PromoteStore" component={PromoteStoreScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}