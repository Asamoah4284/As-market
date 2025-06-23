import React, { useState, useCallback, useEffect } from 'react';
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
  FlatList,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CheckoutForm = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [location, setLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Extract data from route params
  const { cartItems, totalAmount, isPayOnDelivery } = route.params || {};

  const locations = [
    'OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 
    'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 
    'ATL', 'OGUAA', 'KNH'
  ];

  const steps = [
    { id: 1, title: 'Contact', icon: 'person' },
    { id: 2, title: 'Address', icon: 'location' },
    { id: 3, title: 'Delivery', icon: 'calendar' },
    { id: 4, title: 'Review', icon: 'checkmark' }
  ];

  // Load saved checkout data on component mount
  useEffect(() => {
    loadSavedCheckoutData();
  }, []);

  const loadSavedCheckoutData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('checkoutFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Load saved data into form fields
        if (parsedData.phone) setPhone(parsedData.phone);
        if (parsedData.alternativePhone) setAlternativePhone(parsedData.alternativePhone);
        if (parsedData.location) setLocation(parsedData.location);
        if (parsedData.roomNumber) setRoomNumber(parsedData.roomNumber);
        if (parsedData.additionalInfo) setAdditionalInfo(parsedData.additionalInfo);
        
        // Load saved delivery date if it's not in the past
        if (parsedData.deliveryDate) {
          const savedDate = new Date(parsedData.deliveryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (savedDate >= today) {
            setDeliveryDate(savedDate);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved checkout data:', error);
    } finally {
      setIsLoadingSavedData(false);
    }
  };

  const saveCheckoutData = async () => {
    try {
      setIsSaving(true);
      const formData = {
        phone,
        alternativePhone,
        location,
        roomNumber,
        additionalInfo,
        deliveryDate: deliveryDate.toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('checkoutFormData', JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving checkout data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save data whenever form fields change
  useEffect(() => {
    if (!isLoadingSavedData) {
      saveCheckoutData();
    }
  }, [phone, alternativePhone, location, roomNumber, additionalInfo, deliveryDate, isLoadingSavedData]);

  const clearSavedData = async () => {
    try {
      await AsyncStorage.removeItem('checkoutFormData');
      // Reset form fields
      setPhone('');
      setAlternativePhone('');
      setLocation('');
      setRoomNumber('');
      setAdditionalInfo('');
      setDeliveryDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      Alert.alert('Success', 'Saved checkout data has been cleared.');
    } catch (error) {
      console.error('Error clearing saved data:', error);
      Alert.alert('Error', 'Failed to clear saved data.');
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1:
        if (!phone.trim()) {
          errors.phone = 'Phone number is required';
        } else if (phone.length < 10) {
          errors.phone = 'Please enter a valid phone number';
        }
        break;
      case 2:
        if (!location) {
          errors.location = 'Please select a location';
        }
        break;
      case 3:
        if (!deliveryDate) {
          errors.deliveryDate = 'Please select a delivery date';
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!cartItems || !totalAmount) {
      Alert.alert(
        'Error', 
        'Missing cart information. Please go back to your cart and try again.',
        [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]
      );
      return;
    }

    setLoading(true);

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

    try {
      navigation.navigate('Payment', {
        amount: totalAmount,
        shippingDetails: shippingDetails
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
        <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
      )}
    </TouchableOpacity>
  ), [location]);

  const LocationSelector = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity 
            style={[styles.locationSelectorButton, formErrors.location && styles.inputError]}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={location ? styles.locationSelectedText : styles.locationPlaceholderText}>
              {location || "Select a location"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
          </TouchableOpacity>
          {formErrors.location && (
            <Text style={styles.errorText}>{formErrors.location}</Text>
          )}

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
        <View style={[styles.pickerContainer, formErrors.location && styles.inputError]}>
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
          {formErrors.location && (
            <Text style={styles.errorText}>{formErrors.location}</Text>
          )}
        </View>
      );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="person-circle-outline" size={32} color="#FF6B35" />
              <Text style={styles.stepTitle}>Contact Information</Text>
              <Text style={styles.stepSubtitle}>How can we reach you?</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, formErrors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#555" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (formErrors.phone) {
                      setFormErrors({...formErrors, phone: null});
                    }
                  }}
                  placeholder="Your contact number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
              {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
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
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="location-outline" size={32} color="#FF6B35" />
              <Text style={styles.stepTitle}>Delivery Address</Text>
              <Text style={styles.stepSubtitle}>Where should we deliver your order?</Text>
            </View>
            
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
                  placeholder="Any other details that might help with delivery (Name of Hostel, etc)"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="calendar-outline" size={32} color="#FF6B35" />
              <Text style={styles.stepTitle}>Delivery Preferences</Text>
              <Text style={styles.stepSubtitle}>When would you like your order delivered?</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Delivery Day <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={[styles.datePickerButton, formErrors.deliveryDate && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color="#555" />
                <Text style={styles.dateText}>
                  {formatDate(deliveryDate)}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color="#555" style={{marginLeft: 'auto'}} />
              </TouchableOpacity>
              {formErrors.deliveryDate && <Text style={styles.errorText}>{formErrors.deliveryDate}</Text>}

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

            <View style={styles.deliveryInfo}>
              <View style={styles.infoCard}>
                <Ionicons name="time-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoText}>Delivery time: 9:00 AM - 6:00 PM</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoText}>Free delivery on orders above ₵200</Text>
              </View>
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#FF6B35" />
              <Text style={styles.stepTitle}>Review Order</Text>
              <Text style={styles.stepSubtitle}>Please review your details before proceeding</Text>
            </View>
            
            <View style={styles.reviewSection}>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Contact Information</Text>
                <Text style={styles.reviewText}>📞 {phone}</Text>
                {alternativePhone && <Text style={styles.reviewText}>📞 {alternativePhone} (Alternative)</Text>}
              </View>
              
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Delivery Address</Text>
                <Text style={styles.reviewText}>📍 {location}</Text>
                {roomNumber && <Text style={styles.reviewText}>🏠 Room {roomNumber}</Text>}
                {additionalInfo && <Text style={styles.reviewText}>ℹ️ {additionalInfo}</Text>}
              </View>
              
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Delivery Date</Text>
                <Text style={styles.reviewText}>📅 {formatDate(deliveryDate)}</Text>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items:</Text>
                  <Text style={styles.summaryValue}>{cartItems?.length || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total:</Text>
                  <Text style={styles.summaryValue}>₵{totalAmount?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.clearDataButton}
                onPress={clearSavedData}
              >
                <Ionicons name="trash-outline" size={20} color="#e53935" />
                <Text style={styles.clearDataText}>Clear Saved Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Loading Indicator */}
      {isLoadingSavedData && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading saved data...</Text>
        </View>
      )}
      
      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepIndicator}>
            <View style={[
              styles.stepCircle,
              currentStep >= step.id && styles.stepCircleActive,
              currentStep > step.id && styles.stepCircleCompleted
            ]}>
              {currentStep > step.id ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Ionicons name={step.icon} size={16} color={currentStep >= step.id ? "#fff" : "#999"} />
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= step.id && styles.stepLabelActive
            ]}>
              {step.title}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                currentStep > step.id && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      {/* Saving Indicator */}
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.navButton}
            onPress={prevStep}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={20} color="#333" />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonPrimary, loading && styles.navButtonDisabled]}
          onPress={nextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.navButtonPrimaryText}>
                {currentStep === 4 ? 'Proceed ' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#FF6B35',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#333',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    right: -width / 8,
    width: width / 4,
    height: 2,
    backgroundColor: '#f0f0f0',
  },
  stepLineActive: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e53935',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputError: {
    borderColor: '#e53935',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 56,
    width: '100%',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  locationSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  locationSelectedText: {
    fontSize: 16,
    color: '#333',
  },
  locationPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  deliveryInfo: {
    marginTop: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  reviewSection: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  orderSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  navButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  navButtonPrimary: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  navButtonPrimaryText: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontSize: 20,
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLocationText: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  clearDataText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#e53935',
  },
  savingIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1000,
  },
  savingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
});

export default CheckoutForm; 