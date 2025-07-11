import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { requireAuthentication } from '../utils/authUtils';

const { width, height } = Dimensions.get('window');

const FoodServiceDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { foodItem } = route.params;
  
  // State
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Mock additional images for demonstration
  const additionalImages = foodItem.additionalImages || [
    foodItem.image,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3',
  ];

  useEffect(() => {
    const startAnimations = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();
  }, []);

  const handleQuantityChange = (increment) => {
    const newQuantity = quantity + increment;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
      
      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleOrderFood = async () => {
    if (!(await requireAuthentication(navigation, 'order food'))) {
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Order Placed',
        `Your order for ${quantity}x ${foodItem.name} has been placed successfully!`,
        [
          { text: 'Continue Browsing', style: 'cancel' },
          { text: 'View Orders', onPress: () => navigation.navigate('Orders') }
        ]
      );
    }, 1000);
  };

  const handleCall = () => {
    if (foodItem.contactNumber) {
      Linking.openURL(`tel:${foodItem.contactNumber}`);
    } else {
      Alert.alert('Contact Information', 'Contact number not available');
    }
  };



  const renderImageCarousel = () => (
    <View style={styles.imageCarouselContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageCarousel}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setSelectedImageIndex(index);
        }}
      >
        {additionalImages.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.mainImage} />
            {foodItem.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
            {foodItem.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{foodItem.discount}%</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* Image indicators */}
      <View style={styles.imageIndicators}>
        {additionalImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              selectedImageIndex === index && styles.activeIndicator
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderInfoSection = () => (
    <View style={styles.infoSection}>
      <View style={styles.titleRow}>
        <Text style={styles.foodName}>{foodItem.name}</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.description}>{foodItem.description}</Text>
      
      <View style={styles.ratingRow}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{foodItem.rating}</Text>
          <Text style={styles.ratingCount}>(4.2k reviews)</Text>
        </View>
        <View style={styles.deliveryContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.deliveryText}>{foodItem.deliveryTime}</Text>
        </View>
      </View>
      
      <View style={styles.priceRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>GHS {foodItem.price.toFixed(2)}</Text>
          {foodItem.originalPrice > foodItem.price && (
            <Text style={styles.originalPrice}>GHS {foodItem.originalPrice.toFixed(2)}</Text>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(-1)}
          >
            <Ionicons name="remove" size={20} color="#FF6B35" />
          </TouchableOpacity>
          <Animated.Text style={[styles.quantityText, { transform: [{ scale: pulseAnim }] }]}>
            {quantity}
          </Animated.Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(1)}
          >
            <Ionicons name="add" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderDetailsSection = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionTitle}>Service Details</Text>
      
      {foodItem.foodName && (
        <View style={styles.detailRow}>
          <Ionicons name="restaurant" size={20} color="#FF6B35" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Food Name</Text>
            <Text style={styles.detailValue}>{foodItem.foodName}</Text>
          </View>
        </View>
      )}
      
      {foodItem.preparationTime && (
        <View style={styles.detailRow}>
          <Ionicons name="time" size={20} color="#FF6B35" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Preparation Time</Text>
            <Text style={styles.detailValue}>{foodItem.preparationTime}</Text>
          </View>
        </View>
      )}
      
      {foodItem.operatingHours && (
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#FF6B35" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Operating Hours</Text>
            <Text style={styles.detailValue}>{foodItem.operatingHours}</Text>
          </View>
        </View>
      )}
      
      {foodItem.contactNumber && (
        <View style={styles.detailRow}>
          <Ionicons name="call" size={20} color="#FF6B35" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Contact</Text>
            <Text style={styles.detailValue}>{foodItem.contactNumber}</Text>
          </View>
        </View>
      )}
      
      {foodItem.address && (
        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color="#FF6B35" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{foodItem.address}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
        <Ionicons name="call" size={20} color="#FF6B35" />
        <Text style={styles.secondaryButtonText}>Call</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={handleOrderFood}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="restaurant" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Order Food</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FF6B35', '#FF8E53', '#FFA726']}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Food Service</Text>
            </View>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
      
      <Animated.ScrollView 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderImageCarousel()}
        {renderInfoSection()}
        {renderDetailsSection()}
        
        {/* Spacer for bottom padding */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      
      {/* Fixed bottom action buttons */}
      <View style={styles.bottomContainer}>
        {renderActionButtons()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageCarouselContainer: {
    position: 'relative',
    height: 300,
  },
  imageCarousel: {
    paddingHorizontal: 0,
  },
  imageContainer: {
    width: width,
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  popularBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF4757',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default FoodServiceDetails; 