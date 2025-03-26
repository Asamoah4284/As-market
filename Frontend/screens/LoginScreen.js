import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoginScreen({ navigation }) {
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      const credential = loginMethod === 'email' ? email : phoneNumber;
      
      if (!credential || !password) {
        setError('Please fill in all fields');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [loginMethod === 'email' ? 'email' : 'phone']: credential,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        if (data.token) {
          // Store the token in AsyncStorage
          await AsyncStorage.setItem('userToken', data.token);
          
          // Update this part to match the backend response structure
          const userData = {
            id: data._id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role
          };

          // Store user data if needed
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          
          // Navigate based on role
          const userRole = data.user?.role || data.role;
          
          if (userRole === 'buyer') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'BuyerHome' }],
            });
          } else if (userRole === 'seller') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SellerDashboard' }],
            });
          } else {
            // Default or admin route
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Text style={styles.screenTitle}>Welcome Back</Text>
        
        <View style={styles.loginMethodTabs}>
          <TouchableOpacity 
            style={[
              styles.loginMethodTab, 
              loginMethod === 'email' && styles.activeLoginMethodTab
            ]}
            onPress={() => setLoginMethod('email')}
          >
            <Text style={styles.loginMethodText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.loginMethodTab, 
              loginMethod === 'phone' && styles.activeLoginMethodTab
            ]}
            onPress={() => setLoginMethod('phone')}
          >
            <Text style={styles.loginMethodText}>Phone</Text>
          </TouchableOpacity>
        </View>
        
        {loginMethod === 'email' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter your email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Password</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleLogin}
        >
          <Text style={styles.submitButtonText}>Log In</Text>
        </TouchableOpacity>
        
        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginText}>Or log in with</Text>
          
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <Text>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.switchAuthText}>
            Don't have an account? <Text style={styles.switchAuthLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  loginMethodTabs: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  loginMethodTab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ecf0f1',
  },
  activeLoginMethodTab: {
    borderBottomColor: '#3498db',
  },
  loginMethodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: '#3498db',
    textAlign: 'right',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  socialLoginText: {
    color: '#7f8c8d',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 10,
    width: 100,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  switchAuthText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 20,
  },
  switchAuthLink: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default LoginScreen; 