import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate the content when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide navigation header and configure screen
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
      cardStyle: { backgroundColor: onboardingData[currentIndex]?.backgroundColor || '#FF6B6B' },
    });

    // Add focus listener to ensure background is reset
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.setOptions({
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { backgroundColor: onboardingData[currentIndex]?.backgroundColor || '#FF6B6B' },
      });
    });

    return unsubscribe;
  }, [navigation, currentIndex]);

  // Separate useEffect to immediately update navigation options when currentIndex changes
  useEffect(() => {
    navigation.setOptions({
      cardStyle: { backgroundColor: onboardingData[currentIndex]?.backgroundColor || '#FF6B6B' },
    });
  }, [currentIndex, navigation]);

  const onboardingData = [
    {
      id: '1',
      title: 'Shop Smart. Sell Fast.',
      description: 'Discover a vibrant marketplace. Find the best deals — or open your own store and start selling.',
      backgroundColor: '#FF6B6B',
      type: 'buyer-seller',
    },
    {
      id: '2',
      title: 'List Your Services',
      description: "Whether you're selling products or offering services, Asarion lets you create your store, showcase your skills, and attract the right customers.",
      backgroundColor: '#5D3FD3',
      type: 'store',
    },
    {
      id: '3',
      title: 'Secure & Reliable.',
      description: 'We handle the tech. You focus on growing. Safe payments, verified profiles, and real-time updates – all in one app.',
      backgroundColor: '#00A896',
      type: 'secure',
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      flatListRef.current.scrollToIndex({
        animated: true,
        index: newIndex,
      });
    } else {
      navigation.replace('Welcome');
    }
  };

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      // Navigate to BuyerHome instead of Welcome
      navigation.replace('BuyerHome');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('BuyerHome');
    }
  };

  const renderPhoneMockup = (item) => {
    switch (item.type) {
      case 'buyer-seller':
        return (
          <View style={styles.phoneMockup}>
            <View style={styles.phoneMockupNotch}></View>
            <View style={styles.phoneContent}>
              <View style={styles.splitScreen}>
                <View style={styles.splitLeft}>
                  <View style={styles.buyerSection}>
                    <MaterialCommunityIcons name="shopping" size={28} color="#FF6B6B" />
                    <Text style={styles.splitLabel}>Shop</Text>
                    <View style={styles.productCard}>
                      <View style={styles.productImage} />
                      <View style={styles.productDetails}>
                        <View style={styles.productTitle} />
                        <View style={styles.productPrice} />
                      </View>
                    </View>
                    <View style={styles.buyButton}>
                      <Text style={styles.buttonLabel}>Buy</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.splitRight}>
                  <View style={styles.sellerSection}>
                    <MaterialCommunityIcons name="store" size={28} color="#FF6B6B" />
                    <Text style={styles.splitLabel}>Sell</Text>
                    <View style={styles.uploadContainer}>
                      <MaterialCommunityIcons name="camera" size={24} color="#888" />
                      <View style={styles.uploadBar} />
                    </View>
                    <View style={styles.sellButton}>
                      <Text style={styles.buttonLabel}>List</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      case 'store':
        return (
          <View style={styles.phoneMockup}>
            <View style={styles.phoneMockupNotch}></View>
            <View style={styles.phoneContent}>
              <View style={styles.storeContainer}>
                <View style={styles.storeHeader}>
                  <Text style={styles.storeTitle}>Your Store</Text>
                  <MaterialCommunityIcons name="dots-vertical" size={24} color="#5D3FD3" />
                </View>
                
                <View style={styles.dashboardPreview}>
                  <View style={styles.dashboardMetric}>
                    <Text style={styles.metricValue}>142</Text>
                    <Text style={styles.metricLabel}>Visits</Text>
                  </View>
                  <View style={styles.dashboardMetric}>
                    <Text style={styles.metricValue}>38</Text>
                    <Text style={styles.metricLabel}>Orders</Text>
                  </View>
                  <View style={styles.dashboardMetric}>
                    <Text style={styles.metricValue}>$2.4k</Text>
                    <Text style={styles.metricLabel}>Revenue</Text>
                  </View>
                </View>
                
                <View style={styles.serviceIcons}>
                  <View style={styles.serviceIcon}>
                    <View style={[styles.iconCircle, { backgroundColor: '#5D3FD3' }]}>
                      <MaterialCommunityIcons name="store-outline" size={24} color="#fff" />
                    </View>
                    <Text style={styles.iconLabel}>Store</Text>
                  </View>
                  <View style={styles.serviceIcon}>
                    <View style={[styles.iconCircle, { backgroundColor: '#7B68EE' }]}>
                      <MaterialCommunityIcons name="calendar-check" size={24} color="#fff" />
                    </View>
                    <Text style={styles.iconLabel}>Calendar</Text>
                  </View>
                  <View style={styles.serviceIcon}>
                    <View style={[styles.iconCircle, { backgroundColor: '#9370DB' }]}>
                      <MaterialCommunityIcons name="message-text" size={24} color="#fff" />
                    </View>
                    <Text style={styles.iconLabel}>Chat</Text>
                  </View>
                </View>
                
                <View style={styles.clientList}>
                  <Text style={styles.sectionTitle}>Recent Clients</Text>
                  <View style={styles.clientRow}>
                    <View style={styles.clientAvatar} />
                    <View style={styles.clientInfo}>
                      <View style={styles.clientName} />
                      <View style={styles.clientStatus} />
                    </View>
                  </View>
                  <View style={styles.clientRow}>
                    <View style={styles.clientAvatar} />
                    <View style={styles.clientInfo}>
                      <View style={styles.clientName} />
                      <View style={styles.clientStatus} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      case 'secure':
        return (
          <View style={styles.phoneMockup}>
            <View style={styles.phoneMockupNotch}></View>
            <View style={styles.phoneContent}>
              <View style={styles.secureContainer}>
                <View style={styles.phoneIllustration}>
                  <MaterialCommunityIcons name="cellphone" size={100} color="#00A896" />
                  <View style={styles.thumbsUp}>
                    <MaterialCommunityIcons name="thumb-up" size={30} color="#fff" />
                  </View>
                </View>
                
                <View style={styles.securityFeatures}>
                  <View style={styles.securityFeature}>
                    <View style={styles.securityIconContainer}>
                      <MaterialCommunityIcons name="shield-check" size={24} color="#00A896" />
                    </View>
                    <Text style={styles.securityText}>Verified Profiles</Text>
                  </View>
                  <View style={styles.securityFeature}>
                    <View style={styles.securityIconContainer}>
                      <MaterialCommunityIcons name="lock" size={24} color="#00A896" />
                    </View>
                    <Text style={styles.securityText}>Secure Payments</Text>
                  </View>
                  <View style={styles.securityFeature}>
                    <View style={styles.securityIconContainer}>
                      <MaterialCommunityIcons name="bell" size={24} color="#00A896" />
                    </View>
                    <Text style={styles.securityText}>Real-time Updates</Text>
                  </View>
                </View>
                
                <View style={styles.notificationContainer}>
                  <View style={styles.notification}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.notificationText}>Payment received</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderItem = ({ item, index }) => {
    const isLastScreen = index === onboardingData.length - 1;
    
    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <View style={[styles.slideBackground, { backgroundColor: item.backgroundColor }]} />
        <View style={styles.contentContainer}>
          {renderPhoneMockup(item)}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          const dotWidth = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { opacity, width: dotWidth }
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        translucent={false}
        backgroundColor={onboardingData[currentIndex]?.backgroundColor || '#FF6B6B'}
        barStyle="light-content"
        hidden={false}
      />
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(newIndex);
        }}
        onScrollEndDrag={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(newIndex);
        }}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.footer}>
        <Pagination />
        {currentIndex !== onboardingData.length - 1 ? (
          <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
            <Text style={styles.skipButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.skipButton, styles.getStartedButton]}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.skipButtonText}>Get Started</Text>
            {/* <Ionicons name="arrow-forward" size={20} color="#fff" /> */}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flatList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flatListContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  slide: {
    width,
    height,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    position: 'relative',
    flex: 1,
  },
  slideBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: 60,
    paddingBottom: 120,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    letterSpacing: 1,
  },
  phoneMockup: {
    width: 220,
    height: 400,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 6,
    borderColor: '#333',
    overflow: 'hidden',
    // marginBottom: 10,
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  phoneMockupNotch: {
    width: 100,
    height: 20,
    backgroundColor: '#333',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignSelf: 'center',
  },
  phoneContent: {
    flex: 1,
    // padding: 15,
  },
  splitScreen: {
    flexDirection: 'row',
    flex: 1,
  },
  splitLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    padding: 10,
  },
  splitRight: {
    flex: 1,
    padding: 10,
  },
  buyerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sellerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  splitLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 15,
    color: '#444',
  },
  productCard: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    flexDirection: 'column',
  },
  productImage: {
    width: '100%',
    height: 60,
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  productDetails: {
    width: '100%',
  },
  productTitle: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8,
    width: '80%',
  },
  productPrice: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    width: '40%',
  },
  buyButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  uploadContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  uploadBar: {
    height: 8,
    width: '80%',
    backgroundColor: '#eee',
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden',
  },
  sellButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#eee',
  },
  storeContainer: {
    flex: 1,
    padding: 15,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dashboardPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f7f5ff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  dashboardMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D3FD3',
  },
  metricLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  serviceIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  serviceIcon: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 12,
    color: '#555',
  },
  clientList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    height: 10,
    width: '60%',
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8,
  },
  clientStatus: {
    height: 8,
    width: '40%',
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  secureContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  phoneIllustration: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  thumbsUp: {
    position: 'absolute',
    top: 10,
    right: -15,
    backgroundColor: '#00A896',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityFeatures: {
    width: '100%',
    marginVertical: 10,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
  },
  securityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 168, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  securityText: {
    fontSize: 11,
    color: '#333',
    flex: 1,
  },
  notificationContainer: {
    width: '100%',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  notificationText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    // marginTop: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    // marginRight: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderRadius: 4,
  },

  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  getStartedButton: {
    // backgroundColor: '#FF6B6B',
  },
});

export default OnboardingScreen; 