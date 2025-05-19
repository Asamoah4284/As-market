import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { API_BASE_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

function LoginScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);

  const handleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      const credential = loginMethod === 'email' ? email : phoneNumber;
      
      if (!credential || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          [loginMethod === 'email' ? 'email' : 'phone']: credential,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          await AsyncStorage.setItem('userToken', data.token);
          
          console.log('User token:', data.token);
          
          const userData = {
            id: data.user?._id || data._id,
            name: data.user?.name || data.name,
            email: data.user?.email || data.email,
            role: data.user?.role || data.role,
            phone: data.user?.phone || data.phone
          };

          if (data.user?.role === 'admin' || data.role === 'admin') {
            console.log('Admin logged in with token:', data.token);
          }
          
          dispatch(setCredentials({
            token: data.token,
            userData: userData
          }));

          await handleLoginSuccess(data.token, userData);
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('Network request failed')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (token, userData) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Register push notification token if role is admin
      if (userData.role === 'admin') {
        try {
          const { registerForPushNotificationsAsync } = require('../services/notificationService');
          const pushToken = await registerForPushNotificationsAsync();
          
          if (pushToken) {
            // Send admin token to backend
            await fetch(`${API_BASE_URL}/api/notifications/admin-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pushToken,
                adminKey: 'asarion_admin_key'
              }),
            });
            console.log('Admin push token registered during login');
          } else {
            console.error('Failed to get push token for admin');
          }
        } catch (err) {
          console.error('Error registering admin push token:', err);
        }
      }
      
      // Check if we need to redirect somewhere specific
      const redirectTo = route.params?.redirectTo;

      // Navigate based on user role
      if (userData.role === 'seller') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SellerDashboard' }],
        });
      } else if (userData.role === 'admin') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Admin' }],
        });
      } else {
        // For buyers or if role is not specified
        if (redirectTo) {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'BuyerHome' },
              { name: redirectTo }
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'BuyerHome' }],
          });
        }
      }
    } catch (error) {
      console.error('Error saving auth data:', error);
      Alert.alert('Error', 'Failed to save login information');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5D3FD3" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <LinearGradient
            colors={['#5D3FD3', '#7B68EE']}
            style={styles.headerContainer}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>
                <Text style={{color: '#fff'}}>Uni</Text>
                <Text style={{color: '#FF4757'}}>Market</Text>
              </Text>
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subHeaderText}>Sign in to continue</Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.loginMethodTabs}>
              <TouchableOpacity 
                style={[
                  styles.loginMethodTab, 
                  loginMethod === 'email' && styles.activeLoginMethodTab
                ]}
                onPress={() => setLoginMethod('email')}
              >
                <Ionicons 
                  name="mail-outline" 
                  size={16} 
                  color={loginMethod === 'email' ? '#5D3FD3' : '#888'} 
                  style={styles.tabIcon}
                />
                <Text style={[
                  styles.loginMethodText,
                  loginMethod === 'email' && styles.activeTabText
                ]}>Email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.loginMethodTab, 
                  loginMethod === 'phone' && styles.activeLoginMethodTab
                ]}
                onPress={() => setLoginMethod('phone')}
              >
                <Ionicons 
                  name="call-outline" 
                  size={16} 
                  color={loginMethod === 'phone' ? '#5D3FD3' : '#888'} 
                  style={styles.tabIcon}
                />
                <Text style={[
                  styles.loginMethodText,
                  loginMethod === 'phone' && styles.activeTabText
                ]}>Phone</Text>
              </TouchableOpacity>
            </View>
            
            {loginMethod === 'email' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  secureTextEntry={hidePassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setHidePassword(!hidePassword)}
                >
                  <Ionicons 
                    name={hidePassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#FF4757" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <TouchableOpacity style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'}}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png'}}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.socialButton}>
                  <Image 
                    source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png'}}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  loginMethodTabs: {
    flexDirection: 'row',
    marginBottom: 25,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    padding: 4,
  },
  loginMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeLoginMethodTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  loginMethodText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#5D3FD3',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 14,
    marginLeft: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#5D3FD3',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#5D3FD3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5D3FD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#888',
    marginHorizontal: 15,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  signupText: {
    fontSize: 15,
    color: '#666',
  },
  signupLink: {
    fontSize: 15,
    color: '#5D3FD3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default LoginScreen; 