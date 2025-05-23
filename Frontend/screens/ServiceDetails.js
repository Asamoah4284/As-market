import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { requireAuthentication } from '../App';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ServiceDetails = ({ route }) => {
  const { serviceId } = route.params;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [serviceImages, setServiceImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Fetch service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products/${serviceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch service details');
        }
        
        const data = await response.json();
        console.log('Service data:', data);
        setService(data);
        
        // Extract images from service data
        const images = [];
        
        // Add the main image as the first item
        if (data.image) {
          images.push({
            id: 'main',
            image: data.image,
            title: 'Main Image'
          });
        }
        
        // Add additional images if they exist
        if (data.additionalImages && Array.isArray(data.additionalImages) && data.additionalImages.length > 0) {
          // Map additional images to our format
          const additionalImages = data.additionalImages.map((img, index) => ({
            id: `additional-${index}`,
            image: img,
            title: `Image ${index + 1}`
          }));
          
          images.push(...additionalImages);
        }
        
        // If galleryImages exists (another possible format)
        if (data.galleryImages && Array.isArray(data.galleryImages) && data.galleryImages.length > 0) {
          const galleryImages = data.galleryImages.map((img, index) => ({
            id: `gallery-${index}`,
            image: typeof img === 'string' ? img : img.url,
            title: img.title || `Gallery Image ${index + 1}`
          }));
          
          images.push(...galleryImages);
        }
        
        setServiceImages(images);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!(await requireAuthentication(navigation, 'add to favorites'))) {
      return;
    }
    
    try {
      let newFavorites;
      if (favorites.includes(serviceId)) {
        newFavorites = favorites.filter(id => id !== serviceId);
      } else {
        newFavorites = [...favorites, serviceId];
      }

      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const handleBookService = async () => {
    // Check if user is authenticated
    if (!(await requireAuthentication(navigation, 'book a service'))) {
      return;
    }
    
    // Navigate to service booking screen with service details
    navigation.navigate('ServiceBooking', {
      service: service
    });
  };

  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  // Render portfolio item
  const renderPortfolioItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.portfolioItem}
      onPress={() => {
        setSelectedImage(item.image);
        setImageModalVisible(true);
      }}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.portfolioImage}
        resizeMode="cover"
      />
      {item.title && <Text style={styles.portfolioTitle}>{item.title}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF4757" />
        <Text style={styles.errorText}>
          {error || 'Failed to load service details'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isFavorite = favorites.includes(serviceId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5D3FD3" translucent={true} />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.animatedHeader,
        { opacity: headerOpacity }
      ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF4757" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero Section with Image */}
        <View style={styles.heroContainer}>
          <Animated.Image 
            source={{ uri: service.image }} 
            style={[
              styles.serviceImage,
              { transform: [{ scale: imageScale }] }
            ]}
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          
          {/* Floating Header Elements */}
          <View style={styles.floatingHeader}>
            <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingFavoriteButton} onPress={toggleFavorite}>
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#FF4757" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>Service</Text>
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Service Name and Price */}
          <View style={styles.titlePriceContainer}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>GH¢{service.price?.toFixed(2)}</Text>
          </View>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star} 
                  name={star <= (service.rating || 4) ? "star" : "star-outline"} 
                  size={18} 
                  color="#FFD700" 
                />
              ))}
            </View>
            <Text style={styles.ratingCount}>
              {service.rating || 4.0} ({service.numReviews || 0} reviews)
            </Text>
          </View>

          {/* Quick Info Pills */}
          <View style={styles.quickInfoContainer}>
            <View style={styles.quickInfoPill}>
              <Ionicons name="time-outline" size={16} color="#5D3FD3" />
              <Text style={styles.quickInfoText}>1 hour</Text>
            </View>
            <View style={styles.quickInfoPill}>
              <Ionicons name="calendar-outline" size={16} color="#5D3FD3" />
              <Text style={styles.quickInfoText}>Available Now</Text>
            </View>
            <View style={styles.quickInfoPill}>
              <MaterialIcons name="verified" size={16} color="#5D3FD3" />
              <Text style={styles.quickInfoText}>Verified</Text>
            </View>
          </View>

          {/* Provider Info */}
          <View style={styles.providerContainer}>
            <View style={styles.sectionHeader}>
              {/* <Ionicons name="person" size={20} color="#5D3FD3" /> */}
              <Text style={styles.sectionTitle}>Service Provider</Text>
            </View>
            <View style={styles.providerContent}>
              <Image 
                source={{ 
                  uri: service.seller?.image || 'https://ui-avatars.com/api/?name=Service+Provider&background=5D3FD3&color=fff' 
                }} 
                style={styles.providerImage} 
              />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>
                  {service.seller?.name || 'Service Provider'}
                </Text>
                <View style={styles.providerInfoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.providerText}>
                    {service.location || 'Location not specified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#5D3FD3" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>{service.description}</Text>
          </View>

          {/* Service Images / Portfolio Section - UPDATED SECTION */}
          {serviceImages.length > 1 && (
            <View style={styles.portfolioContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="images" size={20} color="#5D3FD3" />
                <Text style={styles.sectionTitle}>Service Gallery</Text>
              </View>
              
              <FlatList
                data={serviceImages.slice(1)} // Skip the main image which is already shown at the top
                renderItem={renderPortfolioItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.portfolioList}
              />
            </View>
          )}

          {/* Features/What's Included */}
          {service.features && service.features.length > 0 && (
            <View style={styles.featuresContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={20} color="#5D3FD3" />
                <Text style={styles.sectionTitle}>What's Included</Text>
              </View>
              <View style={styles.featuresGrid}>
                {service.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Availability */}
          <View style={styles.availabilityContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#5D3FD3" />
              <Text style={styles.sectionTitle}>Availability</Text>
            </View>
            <Text style={styles.availabilityText}>
              {service.availability || 'Contact service provider for availability'}
            </Text>
          </View>
          
          {/* Spacer for bottom button */}
          <View style={{ height: 90 }} />
        </View>
      </Animated.ScrollView>

      {/* Image Preview Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookService}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5D3FD3',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#5D3FD3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#5D3FD3',
    height: Platform.OS === 'ios' ? 90 : 70,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  floatingFavoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  serviceBadge: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  titlePriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quickInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickInfoText: {
    fontSize: 12,
    color: '#5D3FD3',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Portfolio styles
  portfolioContainer: {
    marginBottom: 25,
  },
  portfolioList: {
    paddingRight: 16,
  },
  portfolioItem: {
    marginRight: 15,
    width: width * 0.6,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3FD3',
    marginRight: 5,
  },
  noPortfolioContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  noPortfolioText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  
  // Modal styles for image preview
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.9,
    height: width * 1.2,
    borderRadius: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  // Existing styles continued
  providerContainer: {
    marginBottom: 25,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginLeft: 8,
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  providerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  providerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  descriptionContainer: {
    marginBottom: 25,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  featuresContainer: {
    marginBottom: 25,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  featureIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  availabilityContainer: {
    marginBottom: 20,
    padding: 16,
 
  },
  availabilityText: {
    fontSize: 15,
    color: '#444',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  bookButton: {
    backgroundColor: '#5D3FD3',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5D3FD3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ServiceDetails; 