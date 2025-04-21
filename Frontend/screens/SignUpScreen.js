import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';

// Add this constant at the top of your file
const API_URL = 'https://unimarket-ikin.onrender.com';

function SignUpScreen({ navigation }) {
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      if (!userType) {
        setError('Please select whether you want to buy or sell items');
        return;
      }

      // Validate that at least email or phone is provided
      if (!formData.email && !formData.phone) {
        setError('Please provide either an email address or phone number');
        return;
      }

      const response = await fetch(`${API_URL}/api/users/register`, {
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
        // Navigate to login screen after successful signup
        navigation.navigate('Login');
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
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Text style={styles.screenTitle}>Create Account</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
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
              <Text style={styles.userTypeText}>Sell Items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.userTypeButton, 
                userType === 'buyer' && styles.selectedUserType
              ]}
              onPress={() => setUserType('buyer')}
            >
              <Text style={styles.userTypeText}>Buy Items</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Full Name</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Email</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="Enter your university email"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Phone Number</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Password</Text>
          <TextInput 
            style={styles.textInput}
            placeholder="Create a password"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
          />
        </View>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSignUp}>
          <Text style={styles.submitButtonText}>Create Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchAuthText}>
            Already have an account? <Text style={styles.switchAuthLink}>Log In</Text>
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
    padding: 15,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  userTypeContainer: {
    marginBottom: 15,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    marginHorizontal: 5,
  },
  selectedUserType: {
    backgroundColor: '#3498db',
  },
  userTypeText: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 15,
    marginBottom: 6,
    color: '#2c3e50',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchAuthText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 15,
  },
  switchAuthLink: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default SignUpScreen; 