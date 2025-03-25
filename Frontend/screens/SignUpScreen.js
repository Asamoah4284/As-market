import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import axios from 'axios';

function SignUpScreen({ navigation }) {
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      if (!userType) {
        setError('Please select whether you want to buy or sell items');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/users/register', {
        ...formData,
        role: userType
      });

      if (response.data.error === 'User already exists') {
        setError('An account with this email already exists');
        return;
      }

      // Navigate based on user type after successful signup
      navigation.navigate(userType === 'seller' ? 'SellerDashboard' : 'BuyerDashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong');
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
  userTypeContainer: {
    marginBottom: 25,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  userTypeButton: {
    flex: 1,
    padding: 15,
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

export default SignUpScreen; 