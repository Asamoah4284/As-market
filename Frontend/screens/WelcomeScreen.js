import React, { useEffect, useRef, useState } from 'react';
import { Text, View, TouchableOpacity, Animated, StyleSheet, ImageBackground, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkOnboardingStatus } from '../App'; // Import the helper function

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

function WelcomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Multiple animation values for more complex animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  // Check if onboarding has been completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        if (onboardingCompleted === 'true') {
          // Redirect to BuyerHome if onboarding is completed
          navigation.replace('BuyerHome');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setIsLoading(false);
      }
    };
    
    checkOnboarding();
  }, [navigation]);

  useEffect(() => {
    if (!isLoading) {
      // Start animations only after loading check is complete
      Animated.sequence([
        // First animate the main content
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // Then animate the title with a slight delay
        Animated.timing(titleFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Rotate logo animation
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Finally animate the buttons
        Animated.parallel([
          Animated.timing(buttonOpacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(buttonSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isLoading]);

  const spin = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop' }} 
      style={styles.backgroundImage}
      blurRadius={2}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.contentContainer}>
            <Animated.View
              style={[
                styles.animatedContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                },
              ]}
            >
              <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
                <View style={styles.logoInner}>
                  <Text style={styles.logoText}>A</Text>
                </View>
              </Animated.View>
              
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Animated.Text 
                style={[
                  styles.brandText,
                  { opacity: titleFadeAnim }
                ]}
              >
                Asarion
              </Animated.Text>
              <Animated.View 
                style={[
                  styles.taglineContainer,
                  { opacity: titleFadeAnim }
                ]}
              >
                <Text style={styles.marketplaceText}>MARKETPLACE</Text>
                <View style={styles.divider} />
                <Text style={styles.taglineText}>Your premium shopping destination</Text>
              </Animated.View>
            </Animated.View>

            <Animated.View 
              style={[
                styles.buttonContainer,
                {
                  opacity: buttonOpacityAnim,
                  transform: [{ translateY: buttonSlideAnim }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.signUpButton}
                onPress={() => navigation.navigate('SignUp')}
                activeOpacity={0.8}
              >
                <View style={styles.gradientButton}>
                  <Text style={styles.buttonText}>Get Started</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.guestButton}
                onPress={() => navigation.navigate('BuyerHome')}
                activeOpacity={0.8}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: width * 0.08,
    paddingTop: height * 0.12,
    paddingBottom: height * 0.1,
  },
  animatedContainer: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  brandText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,107,107,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  marketplaceText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 4,
    marginBottom: 12,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,107,107,0.7)',
    marginBottom: 12,
    borderRadius: 1,
  },
  taglineText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    borderRadius: 30,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loginButton: {
    paddingVertical: 12,
    width: '100%',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loginButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.5)',
  },
  guestButton: {
    paddingVertical: 12,
    width: '100%',
    marginTop: 10,
  },
  guestButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WelcomeScreen;