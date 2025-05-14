import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { API_BASE_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

function SignUpScreen({ navigation }) {
  const [userType, setUserType] = useState('buyer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);

  const handleSignUp = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      if (!userType) {
        setError('Please select whether you want to buy or sell items');
        setIsLoading(false);
        return;
      }

      // Basic form validation
      if (!formData.name.trim()) {
        setError('Please enter your name');
        setIsLoading(false);
        return;
      }

      // Validate that at least email or phone is provided
      if (!formData.email && !formData.phone) {
        setError('Please provide either an email address or phone number');
        setIsLoading(false);
        return;
      }

      // Password validation
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: userType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message and navigate to login
        Alert.alert(
          "Account Created Successfully",
          "You can now log in with your credentials",
          [{ text: "OK", onPress: () => navigation.navigate('Login') }]
        );
      } else {
        if (data.error === 'User already exists') {
          setError('An account with this email already exists');
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message.includes('Network request failed')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
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
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subHeaderText}>Join our growing marketplace</Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formContainer}>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#FF4757" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.userTypeContainer}>
              <Text style={styles.formLabel}>I want to:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity 
                  style={[
                    styles.userTypeButton, 
                    userType === 'seller' && styles.selectedUserType
                  ]}
                  onPress={() => setUserType('seller')}
                >
                  <Ionicons 
                    name="cart-outline" 
                    size={18} 
                    color={userType === 'seller' ? "#fff" : "#666"} 
                    style={styles.userTypeIcon}
                  />
                  <Text style={[
                    styles.userTypeText,
                    userType === 'seller' && styles.selectedUserTypeText
                  ]}>Sell Items</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.userTypeButton, 
                    userType === 'buyer' && styles.selectedUserType
                  ]}
                  onPress={() => setUserType('buyer')}
                >
                  <Ionicons 
                    name="basket-outline" 
                    size={18} 
                    color={userType === 'buyer' ? "#fff" : "#666"} 
                    style={styles.userTypeIcon}
                  />
                  <Text style={[
                    styles.userTypeText,
                    userType === 'buyer' && styles.selectedUserTypeText
                  ]}>Buy Items</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter your university email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Create a password"
                  placeholderTextColor="#999"
                  secureTextEntry={hidePassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
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
              <Text style={styles.passwordHint}>Password must be at least 6 characters</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
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
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Log In</Text>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
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
    paddingBottom: 20,
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
    flex: 1,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 5,
  },
  selectedUserType: {
    backgroundColor: '#5D3FD3',
  },
  userTypeIcon: {
    marginRight: 8,
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  selectedUserTypeText: {
    color: '#fff',
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
  passwordHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
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
    marginTop: 10,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    color: '#666',
  },
  loginLink: {
    fontSize: 15,
    color: '#5D3FD3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SignUpScreen; 