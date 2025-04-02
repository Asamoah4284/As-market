import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { store } from './store/store';
// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import BuyerHomeScreen from './screens/BuyerHomeScreen';
import BuyerProfileScreen from './screens/BuyerprofileScreen';
import CartScreen from './screens/CartScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import Categories from './screens/Categories';
import SellerDashboardScreen from './screens/SellerDashboardScreen';
import SellerProfileScreen from './screens/SellerProfileScreen';



const Stack = createStackNavigator();


export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="BuyerHome" component={BuyerHomeScreen} />

            <Stack.Screen name="Profile" component={BuyerProfileScreen} />
            {/*  */}
            <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
            <Stack.Screen 
              name="ProductDetails" 
              component={ProductDetailsScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Categories" component={Categories} />
            <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}