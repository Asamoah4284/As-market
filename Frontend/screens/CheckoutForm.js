import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';

const CheckoutForm = ({ navigation, route }) => {
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [location, setLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract data from route params
  const { cartItems, totalAmount, isPayOnDelivery } = route.params || {};

  const locations = [
    'OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 
    'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 
    'ATL', 'OGUAA', 'KNH'
  ];

  const handleSubmit = () => {
    if (!phone) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    const shippingDetails = {
      buyerContact: {
        phone,
        alternativePhone
      },
      shippingAddress: {
        location,
        roomNumber,
        additionalInfo
      },
      preferredDeliveryDay: deliveryDate
    };

    // Validate that we have route parameters needed for checkout
    if (!cartItems || !totalAmount) {
      Alert.alert(
        'Error', 
        'Missing cart information. Please go back to your cart and try again.',
        [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]
      );
      return;
    }

    setLoading(true);

    try {
      // Navigate to Payment screen so user can choose payment method
      navigation.navigate('Payment', {
        amount: totalAmount,
        shippingDetails: shippingDetails
        // Don't specify paymentMethod so user can choose on the PaymentScreen
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to proceed to payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate && event.type !== 'dismissed') {
      // Ensure date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        Alert.alert('Invalid Date', 'Please select a future date for delivery');
        return;
      }
      
      setDeliveryDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderLocationItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.locationItem} 
      onPress={() => {
        setLocation(item);
        setShowLocationModal(false);
      }}
    >
      <Text style={[styles.locationItemText, location === item && styles.selectedLocationText]}>
        {item}
      </Text>
      {location === item && (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  ), [location]);

  const LocationSelector = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity 
            style={styles.locationSelectorButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={location ? styles.locationSelectedText : styles.locationPlaceholderText}>
              {location || "Select a location"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
          </TouchableOpacity>

          <Modal
            visible={showLocationModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowLocationModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              onPress={() => setShowLocationModal(false)}
              activeOpacity={1}
            >
              <BlurView
                intensity={90}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.locationModalContainer}>
                <View style={styles.locationModalHeader}>
                  <Text style={styles.locationModalTitle}>Select a Location</Text>
                  <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={locations}
                  renderItem={renderLocationItem}
                  keyExtractor={item => item}
                  style={styles.locationList}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      );
    } else {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={location}
            onValueChange={(itemValue) => setLocation(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select a location" value="" />
            {locations.map((loc) => (
              <Picker.Item key={loc} label={loc} value={loc} />
            ))}
          </Picker>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Delivery Details</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Your contact number"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alternative Phone (optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={alternativePhone}
                onChangeText={setAlternativePhone}
                placeholder="Alternative contact number"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location <Text style={styles.required}>*</Text></Text>
            <LocationSelector />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Room Number (optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="home-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="Your room number"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Information (optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="information-circle-outline" size={20} color="#555" style={[styles.inputIcon, {alignSelf: 'flex-start', marginTop: 12}]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Any other details that might help with delivery(Name of Hostel, etc)"
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Delivery Day</Text>
          
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#555" />
            <Text style={styles.dateText}>
              {formatDate(deliveryDate)}
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color="#555" style={{marginLeft: 'auto'}} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={deliveryDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8}} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  required: {
    color: '#e53935',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
    shadowOpacity: 0,
    elevation: 1,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Location modal styles for iOS
  locationSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  locationSelectedText: {
    fontSize: 16,
    color: '#333',
  },
  locationPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  locationList: {
    maxHeight: '90%',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLocationText: {
    fontWeight: '500',
    color: '#4CAF50',
  }
});

export default CheckoutForm; 