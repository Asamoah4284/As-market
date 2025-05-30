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
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withTiming 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const PromoteStoreScreen = () => {
  const navigation = useNavigation();
  const theme = {
    primary: '#6366F1',
    primaryGradientStart: '#818CF8',
    primaryGradientEnd: '#4F46E5',
    secondary: '#94A3B8',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    background: '#F8FAFC',
    cardBackground: '#ffffff',
    text: '#1E293B',
    textSecondary: '#64748B',
    inputBackground: '#f1f3f5',
    border: '#E2E8F0',
    highlight: '#EEF2FF',
  };

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userName, setUserName] = useState('');
  const scale = useSharedValue(1);

  useEffect(() => {
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
    { id: 'student-3days', label: '3 Days Promotion', price: 8, durationDays: 3, type: 'Student Plan', icon: 'school' },
    { id: 'student-1week', label: '1 Week Promotion', price: 15, durationDays: 7, type: 'Student Plan', icon: 'book' },
    { id: 'student-2weeks', label: '2 Weeks Promotion', price: 25, durationDays: 14, type: 'Student Plan', icon: 'library' },
  ];

  const businessPlans = [
    { id: 'business-3days', label: '3 Days Promotion', price: 20, durationDays: 3, type: 'Local Business Plan', icon: 'business' },
    { id: 'business-1week', label: '1 Week Promotion', price: 35, durationDays: 7, type: 'Local Business Plan', icon: 'briefcase' },
    { id: 'business-2weeks', label: '2 Weeks Promotion', price: 60, durationDays: 14, type: 'Local Business Plan', icon: 'trending-up' },
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const handleProceed = () => {
    if (!selectedPlan) {
      Alert.alert('Selection Missing', 'Please select a promotion plan.');
      return;
    }
    const message = `Hello, my name is ${userName}. I want to promote my store with the ${selectedPlan.label} (${selectedPlan.type}) plan.`;
    const phoneNumber = '+233542343069';
    const url = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp.');
    });
    Alert.alert('Proceed to WhatsApp', `Hi ${userName}, you will be redirected to WhatsApp to complete your promotion request.`);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const renderPlanCard = (plan, index, array) => {
    const isSelected = selectedPlan?.id === plan.id;
    return (
      <Animated.View
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          { transform: [{ scale: isSelected ? 1.02 : 1 }] },
        ]}
      >
        <TouchableOpacity
          style={styles.planCardContent}
          onPress={() => handlePlanSelect(plan)}
        >
          <LinearGradient
            colors={isSelected ? [theme.primaryGradientStart, theme.primaryGradientEnd] : ['#ffffff', '#ffffff']}
            style={styles.planGradient}
          >
            <View style={styles.planIconContainer}>
              <Ionicons
                name={plan.icon}
                size={28}
                color={isSelected ? '#ffffff' : theme.primary}
              />
            </View>
            <Text style={[styles.planLabel, isSelected && styles.selectedPlanText]}>
              {plan.label}
            </Text>
            <Text style={[styles.planDuration, isSelected && styles.selectedPlanText]}>
              {plan.durationDays} Days
            </Text>
            <Text style={[styles.planPrice, isSelected && styles.selectedPlanText]}>
              GH₵{plan.price.toFixed(2)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promote Your Store</Text>
        <View style={styles.headerButton} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.benefitsContainer}>
          <Text style={styles.welcomeText}>Welcome, {userName}! 👋</Text>
          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>Why Promote Your Store?</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="trending-up" size={20} color={theme.primary} />
              <Text style={styles.benefitText}>Get featured on the marketplace home page</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={20} color={theme.primary} />
              <Text style={styles.benefitText}>Reach more buyers and increase sales</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              <Text style={styles.benefitText}>Stand out with a special seller badge</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="star" size={20} color={theme.primary} />
              <Text style={styles.benefitText}>Priority support and marketing tips</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Student Plans</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansContainer}
        >
          {studentPlans.map((plan, index) => renderPlanCard(plan, index, studentPlans))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Business Plans</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansContainer}
        >
          {businessPlans.map((plan, index) => renderPlanCard(plan, index, businessPlans))}
        </ScrollView>

        <Animated.View style={[styles.submitButtonContainer, animatedStyle]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: (!selectedPlan) ? theme.secondary : theme.primary }
            ]}
            onPress={handleProceed}
            disabled={!selectedPlan}
          >
            <Text style={styles.submitButtonText}>
              {selectedPlan ? 'Proceed to Payment' : 'Select a Plan'}
            </Text>
            <MaterialIcons
              name="arrow-forward"
              size={24}
              color="white"
              style={styles.submitButtonIcon}
            />
          </TouchableOpacity>
        </Animated.View>
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
    paddingVertical: 16,
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
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  benefitsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  benefitsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E293B',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E293B',
  },
  plansContainer: {
    paddingBottom: 8,
    paddingRight: 20,
  },
  planCard: {
    width: width * 0.75,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedPlanCard: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  planCardContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  planGradient: {
    padding: 24,
    alignItems: 'center',
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  planDuration: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  selectedPlanText: {
    color: '#ffffff',
  },
  submitButtonContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  submitButtonIcon: {
    marginLeft: 8,
  },
});

export default PromoteStoreScreen; 