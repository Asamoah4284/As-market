import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import BuyerHomeScreen from './screens/BuyerHomeScreen';
import ProfileScreen from './screens/profileScreen';
import CartScreen from './screens/CartScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import SellerDashboardScreen from './screens/SellerDashboardScreen';



const Stack = createStackNavigator();


export default function App() {
  return (
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
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="BuyerHome" component={BuyerHomeScreen} />

          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
          <Stack.Screen 
            name="ProductDetails" 
            component={ProductDetailsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}