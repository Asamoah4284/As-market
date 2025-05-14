import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PromoteStoreScreen = () => {
  const navigation = useNavigation();
  const theme = {
    primary: '#5D3FD3',
    primaryDark: '#3730A3',
    secondary: '#6c757d',
    success: '#2EC4B6',
    danger: '#E63946',
    warning: '#FF9F1C',
    background: '#F8FAFC',
    cardBackground: '#ffffff',
    text: '#1A1B25',
    textSecondary: '#64748B',
    inputBackground: '#f1f3f5',
    border: '#E2E8F0',
    highlight: '#F0F4FF',
  };

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Fetch user name from AsyncStorage or set a placeholder
    const fetchUserName = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        if (name) {
          setUserName(name);
        } else {
          setUserName('Valued Seller');
        }
      } catch (error) {
        setUserName('Valued Seller');
      }
    };
    fetchUserName();
  }, []);

  const studentPlans = [
    { id: 'student-3days', label: '3 Days Promotion', price: 8, durationDays: 3, type: 'Student Plan' },
    { id: 'student-1week', label: '1 Week Promotion', price: 15, durationDays: 7, type: 'Student Plan' },
    { id: 'student-2weeks', label: '2 Weeks Promotion', price: 25, durationDays: 14, type: 'Student Plan' },
  ];

  const businessPlans = [
    { id: 'business-3days', label: '3 Days Promotion', price: 20, durationDays: 3, type: 'Local Business Plan' },
    { id: 'business-1week', label: '1 Week Promotion', price: 35, durationDays: 7, type: 'Local Business Plan' },
    { id: 'business-2weeks', label: '2 Weeks Promotion', price: 60, durationDays: 14, type: 'Local Business Plan' },
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleProceed = () => {
    if (!selectedPlan) {
      Alert.alert('Selection Missing', 'Please select a promotion plan.');
      return;
    }
    // Compose WhatsApp message
    const message = `Hello, my name is ${userName}. I want to promote my store with the ${selectedPlan.label} (${selectedPlan.type}) plan.`;
    const phoneNumber = '+233542343069';
    const url = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp.');
    });
    Alert.alert('Proceed to WhatsApp', `Hi ${userName}, you will be redirected to WhatsApp to complete your promotion request.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.primary }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}> 
          <MaterialIcons name="arrow-back" size={24} color="white" /> 
        </TouchableOpacity> 
        <Text style={styles.headerTitle}>Promote Your Store</Text> 
        <View style={styles.headerButton} />
      </View>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>Why Promote Your Store?</Text>
          <Text style={styles.benefitsText}>
            • Get your store featured on the marketplace home page. {'\n'}
            • Reach more buyers and increase your sales. {'\n'}
            • Stand out from other sellers with a special badge. {'\n'}
            • Enjoy priority support and exclusive marketing tips.
          </Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Student Plan</Text>
        {studentPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.optionButton,
              { borderColor: theme.border, backgroundColor: theme.cardBackground },
              selectedPlan?.id === plan.id && { backgroundColor: theme.highlight, borderColor: theme.primary }
            ]}
            onPress={() => handlePlanSelect(plan)}
          >
            <Text style={[styles.optionLabel, { color: theme.text }]}>{plan.label}</Text>
            <Text style={[styles.optionPrice, { color: theme.primary }]}>GH₵{plan.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Local Business Plan</Text>
        {businessPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.optionButton,
              { borderColor: theme.border, backgroundColor: theme.cardBackground },
              selectedPlan?.id === plan.id && { backgroundColor: theme.highlight, borderColor: theme.primary }
            ]}
            onPress={() => handlePlanSelect(plan)}
          >
            <Text style={[styles.optionLabel, { color: theme.text }]}>{plan.label}</Text>
            <Text style={[styles.optionPrice, { color: theme.primary }]}>GH₵{plan.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.submitButton, 
            { backgroundColor: (!selectedPlan) ? theme.secondary : theme.primary }
          ]}
          onPress={handleProceed}
          disabled={!selectedPlan}
        >
          <Text style={styles.submitButtonText}>
            Proceed to Payment
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#5D3FD3',
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  benefitsBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#5D3FD3',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#5D3FD3',
  },
  benefitsText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default PromoteStoreScreen; 