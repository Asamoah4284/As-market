import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL } from '../config/api';

const ServiceBooking = ({ route }) => {
  const { service } = route.params;
  const navigation = useNavigation();
  
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerName, setSellerName] = useState('');

  // Get customer info when component mounts
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsedInfo = JSON.parse(userInfo);
          setCustomerName(parsedInfo.name || '');
          setCustomerPhone(parsedInfo.phone || '');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch seller info on mount
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setLoading(true);
        const sellerId = service.seller?._id || service.sellerId;
        if (!sellerId) {
          setLoading(false);
          Alert.alert('Error', 'No seller ID found for this service.');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/users/${sellerId}`);
        if (!response.ok) {
          setLoading(false);
          Alert.alert('Error', 'Could not fetch provider info.');
          return;
        }
        const data = await response.json();
        setSellerPhone(data.phone);
        setSellerName(data.name);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'Could not fetch provider info.');
      }
    };
    fetchSeller();
  }, [service]);

  // Format date and time for display
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  // WhatsApp integration (no booking, just open chat)
  const openWhatsApp = async () => {
    if (!sellerPhone) {
      Alert.alert('Error', 'Provider phone number not available.');
      return;
    }
    // Remove any non-digit characters and leading +
    let formattedNumber = sellerPhone.replace(/[^\d]/g, '');
    if (formattedNumber.startsWith('0')) {
      // If number starts with 0, replace with country code (assume Ghana +233 as before)
      formattedNumber = '233' + formattedNumber.slice(1);
    }
    // Open WhatsApp chat
    const whatsappUrl = `https://wa.me/${formattedNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'Could not open WhatsApp.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open WhatsApp.');
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5D3FD3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.container}>
        {/* Service Info Summary */}
        <View style={styles.serviceSummary}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceProvider}>
            {service.seller?.name || 'Service Provider'}
          </Text>
          <Text style={styles.servicePrice}>
            GH¢{service.price?.toFixed(2)}
          </Text>
        </View>

        {/* Customer Information */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Your Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={[styles.input, {marginTop: 12}]}
            placeholder="Your Phone Number"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
        </View>
        
        {/* Date Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#5D3FD3" />
            <Text style={styles.dateTimeText}>{formattedDate}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
        
        {/* Time Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={24} color="#5D3FD3" />
            <Text style={styles.dateTimeText}>{formattedTime}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
          
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
        </View>
        
        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special requirements or notes for the service provider"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        {/* Booking Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{formattedDate}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{formattedTime}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.totalPrice}>GH¢{service.price?.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={openWhatsApp}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.confirmButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm & Chat with Provider</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#5D3FD3',
  },
  headerTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  serviceSummary: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: 'black',
  },
  summaryValue: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 14,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default ServiceBooking; 