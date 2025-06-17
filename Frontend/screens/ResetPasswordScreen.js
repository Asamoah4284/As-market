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
  StatusBar,
  SafeAreaView
} from 'react-native';
import { API_ENDPOINTS } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';

function ResetPasswordScreen({ navigation, route }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extract token from route params or deep link
    const extractToken = async () => {
      let resetToken = '';
      
      // First, try to get token from route params
      if (route.params?.token) {
        resetToken = route.params.token;
        console.log('Token from route params:', resetToken);
      } else {
        // If no route params, try to get from initial URL (deep link)
        try {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const parsedUrl = Linking.parse(initialUrl);
            if (parsedUrl.hostname === 'reset-password' && parsedUrl.queryParams?.token) {
              resetToken = parsedUrl.queryParams.token;
              console.log('Token from deep link:', resetToken);
            }
          }
        } catch (error) {
          console.error('Error extracting token from deep link:', error);
        }
      }
      
      setToken(resetToken);
      
      if (!resetToken) {
        setError('Invalid reset link. Please request a new password reset.');
      }
    };

    extractToken();
  }, [route.params]);

  const handleResetPassword = async () => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);
      
      if (!token) {
        setError('Invalid reset token');
        setIsLoading(false);
        return;
      }

      if (!newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password has been reset successfully! You can now login with your new password.');
        setNewPassword('');
        setConfirmPassword('');
        
        // Navigate to login after a short delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.message.includes('Network request failed')) {
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.welcomeText}>Reset Password</Text>
            <Text style={styles.subHeaderText}>Enter your new password</Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  secureTextEntry={hidePassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
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

            <View style={styles.inputGroup}>
              <Text style={styles.formLabel}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry={hideConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                >
                  <Ionicons 
                    name={hideConfirmPassword ? "eye-outline" : "eye-off-outline"} 
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

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}
            
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleResetPassword}
              disabled={isLoading || !token}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.backToLoginContainer}>
              <Text style={styles.backToLoginText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backToLoginLink}>Back to Login</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: -15,
  },
  logoImage: {
    width: 80,
    height: 80,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
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
    marginBottom: 25,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  backToLoginText: {
    fontSize: 15,
    color: '#666',
  },
  backToLoginLink: {
    fontSize: 15,
    color: '#5D3FD3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default ResetPasswordScreen; 