import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  Linking,
  Platform,
  Animated,
  Share,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../store/slices/productSlice';
import * as Location from 'expo-location';
import { handleAddToCartNotification } from '../services/notificationService';
import { requireAuthentication } from '../App';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from "expo-linear-gradient";
import OptimizedImage from "../components/OptimizedImage";
import { useImagePreloader } from "../hooks/useImagePreloader";

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const dispatch = useDispatch();
  const { currentProduct, isLoading, error } = useSelector((state) => state.products);

  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const windowWidth = Dimensions.get("window").width;
  const flatListRef = React.useRef(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Add new state for comments
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);

  // Add new state for fullscreen modal
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Add new state for contact modal
  const [contactModalVisible, setContactModalVisible] = useState(false);
  
  // Add state for similar products
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Add state for location
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Add animation for pulsing location marker
  const [pulseAnim] = useState(new Animated.Value(0));

  // Add slideshow state
  const [isSlideshowActive, setIsSlideshowActive] = useState(true);
  const [slideshowInterval, setSlideshowInterval] = useState(null);
  const slideshowDuration = 3000; // 3 seconds per image

  // Extract all product images for preloading
  const productImages = currentProduct ? [
    currentProduct.image,
    ...(currentProduct.additionalImages || [])
  ].filter(Boolean) : [];

  // Preload product images with high priority and banner quality for main images
  useImagePreloader(productImages, true, 5, {
    width: 1200,
    quality: '80',
    format: 'auto',
    maintainQuality: true
  });

  // Add useFocusEffect to refresh product data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (productId) {
        // Clear the product cache for this product
        AsyncStorage.removeItem(`product_${productId}`);
        // Fetch fresh product data
        dispatch(fetchProductById(productId));
      }
    }, [productId])
  );

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }
  }, [dispatch, productId]);

  // Add effect to log product data changes
  useEffect(() => {
    console.log('Current Product Data:', {
      id: currentProduct?._id,
      name: currentProduct?.name,
      stock: currentProduct?.stock,
      fullData: currentProduct
    });
  }, [currentProduct]);

  // Add effect to fetch comments on component mount
  useEffect(() => {
    if (productId) {
      fetchComments();
    }
  }, [productId]);

  // Add effect to get user location
  useEffect(() => {
    let locationSubscription = null;
    
    (async () => {
      try {
        setLoadingLocation(true);
        
        // First request permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied. Please enable location services to see delivery options.');
          setLoadingLocation(false);
          return;
        }

        // Get last known location first for faster response
        let lastKnownLocation = await Location.getLastKnownPositionAsync({});
        if (lastKnownLocation) {
          setLocation(lastKnownLocation);
        }

        // Then get current location with better accuracy
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });
        
        setLocation(currentLocation);
        console.log('Location:', currentLocation);
        
        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // update if moved by 10 meters
            timeInterval: 30000, // or every 30 seconds
          },
          (newLocation) => {
            console.log('Location updated:', newLocation);
            setLocation(newLocation);
          }
        );
      } catch (error) {
        console.error('Error getting location:', error);
        setErrorMsg('Could not retrieve your location. Please check your device settings.');
      } finally {
        setLoadingLocation(false);
      }
    })();
    
    // Cleanup subscription when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Add animation for pulsing location marker
  useEffect(() => {
    // Only start animation when we have a location
    if (location) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [location, pulseAnim]);

  useEffect(() => {
    console.log('Current Product:', currentProduct);
    console.log('Product Images:', currentProduct?.additionalImages);
    console.log('Number of Images:', currentProduct?.additionalImages?.length);
  }, [currentProduct]);

  // Add effect to fetch similar products when current product changes
  useEffect(() => {
    if (currentProduct && currentProduct.category) {
      fetchSimilarProducts();
    }
  }, [currentProduct]);

  // Add slideshow management effects
  useEffect(() => {
    // Start slideshow when product loads and has multiple images
    if (currentProduct && currentProduct.additionalImages && currentProduct.additionalImages.length > 0) {
      startSlideshow();
    }

    // Cleanup slideshow on unmount
    return () => {
      stopSlideshow();
    };
  }, [currentProduct]);

  // Add effect to handle slideshow when user manually scrolls
  useEffect(() => {
    // Stop slideshow when user manually changes image
    if (slideshowInterval) {
      stopSlideshow();
      // Restart after 3 seconds of inactivity
      const restartTimer = setTimeout(() => {
        if (currentProduct && currentProduct.additionalImages && currentProduct.additionalImages.length > 0) {
          startSlideshow();
        }
      }, 3000);

      return () => clearTimeout(restartTimer);
    }
  }, [activeImageIndex]);

  // Function to fetch similar products
  const fetchSimilarProducts = async () => {
    if (!currentProduct || !currentProduct.category) {
      console.log("Cannot fetch similar products: no current product or category");
      return;
    }
    
    try {
      setLoadingSimilar(true);
      console.log("Fetching similar products for category:", currentProduct.category);
      
      // Use the original API endpoint format
      const apiUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://${API_BASE_URL}`;
      const response = await fetch(`${apiUrl}/api/products`);
      
      if (!response.ok) {
        console.error("Failed to fetch products:", response.status);
        return;
      }

      const data = await response.json();
      
      // Handle different response formats
      let productsArray = Array.isArray(data) ? data : 
                         (data.products && Array.isArray(data.products)) ? data.products :
                         (data.data && Array.isArray(data.data)) ? data.data : [];
      
      // Filter by the same category and exclude current product
      const filteredProducts = productsArray.filter(product => 
        product.category === currentProduct.category && 
        product._id !== currentProduct._id
      );
      
      console.log(`Found ${filteredProducts.length} similar products`);
      setSimilarProducts(filteredProducts.slice(0, 10)); // Limit to 10 items
    } catch (err) {
      console.error("Error fetching similar products:", err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Add fetchComments function
  const fetchComments = async () => {
    if (!currentProduct?._id) return;
    
    try {
      setLoadingComments(true);
      setCommentError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/products/${currentProduct._id}/comments`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentError(error.message);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add handleSubmitComment function
  const handleSubmitComment = async () => {
    if (!(await requireAuthentication(navigation, 'post a comment'))) {
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/products/${currentProduct._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: commentText,
          rating: selectedRating,
          sellerPrice: currentProduct.price
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }
      
      const newComment = await response.json();
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentText('');
      setSelectedRating(0);
      
      // Refresh product to get updated rating
      if (currentProduct?._id) {
        dispatch(fetchProductById(currentProduct._id));
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', error.message || 'Failed to post comment. Please try again.');
    }
  };

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!(await requireAuthentication(navigation, 'add items to cart'))) {
      return;
    }

    // Check if requested quantity is available
    if (currentProduct.stock < quantity) {
      Alert.alert(
        "Insufficient Stock", 
        `Only ${currentProduct.stock} units available. Please reduce quantity.`
      );
      return;
    }

    setAddingToCart(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      // Add a local loading state for the button
      // Use the consistent API URL pattern
      const apiUrl = API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://${API_BASE_URL}`;
      const response = await fetch(`${apiUrl}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: currentProduct._id,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Send notification
        await handleAddToCartNotification(currentProduct.name, dispatch);
        
        // Note: Stock is not decreased when adding to cart, only when order is completed
        // So we don't need to refresh the product data here
        
        Alert.alert("Success", "Product added to cart successfully!", [
          { 
            text: "View Cart", 
            onPress: () => navigation.navigate("Cart") 
          },
          { 
            text: "Continue Shopping", 
            style: "cancel" 
          }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.message || "Failed to add product to cart"
        );
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setQuantityInput(newQuantity.toString());
    }
  };

  const increaseQuantity = () => {
    if (currentProduct && currentProduct.stock && quantity < currentProduct.stock) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      setQuantityInput(newQuantity.toString());
    } else {
      Alert.alert("Stock Limit", `Only ${currentProduct?.stock || 0} units available.`);
    }
  };

  // Add function to handle quantity input change
  const handleQuantityChange = (text) => {
    // Allow empty string for typing
    if (text === "") {
      setQuantityInput("");
      return;
    }
    
    const newQuantity = parseInt(text);
    
    // Only update if it's a valid number
    if (!isNaN(newQuantity)) {
      setQuantityInput(text);
      
      // Validate the input
      if (newQuantity < 1) {
        setQuantity(1);
      } else if (currentProduct && currentProduct.stock && newQuantity > currentProduct.stock) {
        setQuantity(currentProduct.stock);
        setQuantityInput(currentProduct.stock.toString());
        Alert.alert("Stock Limit", `Only ${currentProduct.stock} units available.`);
      } else {
        setQuantity(newQuantity);
      }
    }
  };

  // Add function to handle quantity input blur (when user finishes typing)
  const handleQuantityBlur = () => {
    if (quantityInput === "" || parseInt(quantityInput) < 1) {
      setQuantity(1);
      setQuantityInput("1");
    }
  };

  // Add this function to handle image press
  const handleImagePress = (index) => {
    setActiveImageIndex(index);
    setIsFullscreen(true);
  };

  // Add slideshow control functions
  const startSlideshow = () => {
    if (!currentProduct?.additionalImages || currentProduct.additionalImages.length === 0) {
      return; // No additional images to slideshow
    }

    const totalImages = [currentProduct.image, ...currentProduct.additionalImages].length;
    
    const interval = setInterval(() => {
      setActiveImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % totalImages;
        
        // Scroll to the next image
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        
        return nextIndex;
      });
    }, slideshowDuration);

    setSlideshowInterval(interval);
    setIsSlideshowActive(true);
  };

  const stopSlideshow = () => {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      setSlideshowInterval(null);
    }
    setIsSlideshowActive(false);
  };

  const toggleSlideshow = () => {
    if (isSlideshowActive) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  };

  const handleSlideshowTouch = () => {
    // Pause slideshow when user touches the image
    if (isSlideshowActive) {
      stopSlideshow();
      // Restart after 5 seconds of inactivity
      setTimeout(() => {
        if (!isSlideshowActive) {
          startSlideshow();
        }
      }, 5000);
    }
  };

  // Add function to handle contact seller
  const handleContactSeller = async () => {
    // Check if user is authenticated
    if (!(await requireAuthentication(navigation, 'contact the seller'))) {
      return;
    }
    
    setContactModalVisible(true);
  };

  // Add function to open WhatsApp
  const contactViaWhatsApp = () => {
    // Use the provided number as the default seller phone
    const sellerPhone = currentProduct.seller?.phone || "0542343069";
    
    // Show a dialog to confirm using the phone number
    Alert.alert(
      "Contact via WhatsApp",
      `Connect with the seller at ${sellerPhone}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Continue",
          onPress: () => {
            openWhatsApp(sellerPhone);
          }
        }
      ]
    );
    
    setContactModalVisible(false);
  };

  // Helper function to open WhatsApp with a specific phone number
  const openWhatsApp = (phoneNumber) => {
    // Format the number - ensure it has international format
    // Remove any non-digits except the + sign
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, "");
    
    // If number doesn't start with +, add Ghana's country code
    if (!formattedPhone.startsWith('+')) {
      // If it starts with 0, replace the 0 with +233
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+233' + formattedPhone.substring(1);
      } else {
        // Otherwise just add +233 prefix
        formattedPhone = '+233' + formattedPhone;
      }
    }
    
    const message = `Hello, I'm interested in your product: ${currentProduct.name}`;
    
    // Try multiple WhatsApp URL formats for better compatibility
    const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    const whatsappUrlAlt = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    // First try the deep link format
    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // If deep link doesn't work, try the web URL format
          Linking.canOpenURL(whatsappUrlAlt)
            .then(webSupported => {
              if (webSupported) {
                return Linking.openURL(whatsappUrlAlt);
              } else {
                Alert.alert(
                  "WhatsApp Issue", 
                  "Unable to open WhatsApp. Please make sure WhatsApp is installed correctly or try reinstalling the app.",
                  [
                    { 
                      text: "Copy Number", 
                      onPress: () => {
                        // Here you would copy the number to clipboard
                        Alert.alert("Phone number copied", `${formattedPhone}`);
                      }
                    },
                    { text: "OK" }
                  ]
                );
              }
            })
            .catch(err => console.error('Error opening WhatsApp web link:', err));
        }
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
  };

  // Add function to view seller profile
  const viewSellerProfile = () => {
    // Use the provided number 
    const phoneNumber = "0542343069";
    
    // Create a phone URI
    const phoneUrl = `tel:${phoneNumber}`;
    
    // Try to open phone app
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert("Phone Call Failed", "Your device doesn't support making calls directly. Please dial this number manually: " + phoneNumber);
        }
      })
      .catch(err => {
        console.error('Error opening phone app:', err);
        Alert.alert("Error", "Could not open phone app. Please dial this number manually: " + phoneNumber);
      });
    
    setContactModalVisible(false);
  };

  // Add function to share product
  const handleShareProduct = async () => {
    if (!currentProduct?._id) {
      Alert.alert("Error", "Product information not available for sharing.");
      return;
    }

    try {
      // Create the deep link URL
      const deepLinkUrl = `asarion://product?id=${currentProduct._id}`;
      
      // Create a fallback web URL (you can replace this with your actual website URL)
      const webUrl = `https://your-website.com/product/${currentProduct._id}`;
      
      // Create the share message
      const shareMessage = `Check out this amazing product: ${currentProduct.name}\n\nPrice: GH₵${currentProduct.price?.toFixed(2)}\n\n${deepLinkUrl}\n\nIf the link doesn't work, visit: ${webUrl}`;
      
      // Share the product
      const result = await Share.share({
        message: shareMessage,
        title: currentProduct.name,
        url: deepLinkUrl, // This will be used on platforms that support it
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type (e.g., WhatsApp, Facebook, etc.)
          console.log('Shared with activity type:', result.activityType);
        } else {
          // Shared, but we don't know the activity type
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      Alert.alert("Error", "Failed to share product. Please try again.");
    }
  };

  // Add utility functions for delivery estimation
  const calculateDeliveryCost = (location) => {
    // Fixed delivery fee of GH₵5 for orders below GH₵200
    return "5.00";
  };
  
  const estimateDeliveryTime = (location) => {
    // Simple calculation - 15 min base time + 5 min per km
    const storeLatitude = 5.6037;
    const storeLongitude = -0.1870;
    
    const distance = calculateDistance(
      storeLatitude, 
      storeLongitude,
      location.coords.latitude,
      location.coords.longitude
    );
    
    return Math.ceil(15 + (distance * 5));
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchProductById(productId))}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentProduct) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {console.log('Rendering Product Details:', {
        productId,
        currentProduct,
        images: currentProduct?.additionalImages,
        imageCount: currentProduct?.additionalImages?.length
      })}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Add the Modal component */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isFullscreen}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={currentProduct?.additionalImages || []}
            horizontal
            pagingEnabled
            initialScrollIndex={activeImageIndex}
            getItemLayout={(data, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Pressable 
                style={styles.fullscreenImageContainer}
                onPress={() => setIsFullscreen(false)}
              >
                <OptimizedImage
                  source={item}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                  placeholderColor="#000"
                  showLoadingIndicator={true}
                  imageType="banner"
                  onError={(e) => {
                    console.log('Image loading error:', item);
                  }}
                />
              </Pressable>
            )}
          />
          <View style={styles.fullscreenPaginationContainer}>
            {(currentProduct?.additionalImages || []).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.fullscreenPaginationDot,
                  index === activeImageIndex && styles.fullscreenPaginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.contactModalOverlay}
          activeOpacity={1}
          onPress={() => setContactModalVisible(false)}
        >
          <View style={styles.contactModalContainer}>
            <View style={styles.contactModalContent}>
              <View style={styles.contactModalHeader}>
                <Text style={styles.contactModalTitle}>Contact Seller</Text>
                <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              
              <TouchableOpacity 
                style={styles.contactOption}
                onPress={contactViaWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={styles.contactOptionText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.contactOption}
                onPress={viewSellerProfile}
              >
                <Ionicons name="call" size={24} color="#4CAF50" />
                <Text style={styles.contactOptionText}>Contact Seller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShareProduct}
          >
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="heart-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Product Image Carousel */}
        <View style={styles.imageContainer}>
          {currentProduct?.additionalImages && Array.isArray(currentProduct.additionalImages) && currentProduct.additionalImages.length > 0 ? (
            <>
              {/* Slideshow Control Button */}
              <TouchableOpacity 
                style={styles.slideshowControlButton}
                onPress={toggleSlideshow}
              >
                <Ionicons 
                  name={isSlideshowActive ? "pause" : "play"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>

              <FlatList
                ref={flatListRef}
                data={[currentProduct.image, ...currentProduct.additionalImages]}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                onScroll={(event) => {
                  const contentOffsetX = event.nativeEvent.contentOffset.x;
                  const newIndex = Math.round(contentOffsetX / windowWidth);
                  if (newIndex !== activeImageIndex) {
                    setActiveImageIndex(newIndex);
                  }
                }}
                scrollEventThrottle={16}
                onTouchStart={handleSlideshowTouch}
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    style={[styles.imageSlide, { width: windowWidth }]}
                    onPress={() => handleImagePress(index)}
                    activeOpacity={0.9}
                  >
                    <OptimizedImage
                      source={item}
                      style={styles.productImage}
                      resizeMode="cover"
                      placeholderColor="#f0f0f0"
                      showLoadingIndicator={true}
                      imageType="banner"
                      onError={(e) => {
                        console.log('Image loading error:', item);
                      }}
                    />
                  </TouchableOpacity>
                )}
              />
              {/* Only show pagination if there's more than one image */}
              {(currentProduct.additionalImages.length + 1) > 1 && (
                <View style={styles.paginationContainer}>
                  {[currentProduct.image, ...currentProduct.additionalImages].map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        flatListRef.current?.scrollToIndex({
                          index,
                          animated: true,
                        });
                        setActiveImageIndex(index);
                      }}
                    >
                      <View
                        style={[
                          styles.paginationDot,
                          index === activeImageIndex && styles.paginationDotActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Slideshow Status Indicator */}
              {isSlideshowActive && (
                <View style={styles.slideshowIndicator}>
                  <Ionicons name="play-circle" size={16} color="#fff" />
                  <Text style={styles.slideshowIndicatorText}>Auto</Text>
                </View>
              )}
            </>
          ) : (
            // Fallback to single image
            <OptimizedImage
              source={currentProduct?.image || "https://via.placeholder.com/400"}
              style={styles.productImage}
              resizeMode="cover"
              placeholderColor="#f0f0f0"
              showLoadingIndicator={true}
              imageType="banner"
              onError={(e) => {
                console.log("Image loading error:", e.nativeEvent.error);
              }}
            />
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{currentProduct.name}</Text>
          </View>
          
          {/* Stock Status Indicator */}
          <View style={styles.stockStatusContainer}>
            {currentProduct.stock > 5 ? (
              <View style={styles.stockStatusIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.stockStatusText, styles.inStockText]}>
                  In Stock ({currentProduct.stock} available)
                </Text>
              </View>
            ) : currentProduct.stock > 0 ? (
              <View style={styles.stockStatusIndicator}>
                <Ionicons name="alert-circle" size={16} color="#FFC107" />
                <Text style={[styles.stockStatusText, styles.lowStockText]}>
                   Low Stock ({currentProduct.stock} remaining)
                </Text>
              </View>
            ) : (
              <View style={styles.stockStatusIndicator}>
                <Ionicons name="close-circle" size={16} color="#F44336" />
                <Text style={[styles.stockStatusText, styles.outOfStockText]}>
                   Out of Stock (0 available)
                </Text>
              </View>
            )}
          </View>
          
          {/* Price and Quantity Row */}
          <View style={styles.priceQuantityRow}>
            <View style={styles.productPriceContainer}>
              <Text style={styles.productPrice}>GH₵{currentProduct.price?.toFixed(2)}</Text>
            </View>
            
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={decreaseQuantity}
                >
                  <Ionicons name="remove" size={20} color="#5D3FD3" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={quantityInput}
                  onChangeText={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  keyboardType="numeric"
                  textAlign="center"
                  maxLength={3}
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={increaseQuantity}
                >
                  <Ionicons name="add" size={20} color="#5D3FD3" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Rating Stars Row */}
          <View style={styles.ratingStarsContainer}>
            <View style={styles.ratingSection}>
              <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
              <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
              <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
              <Ionicons name="star-half" size={18} color="#FFD700" style={styles.starIcon} />
              <Ionicons name="star-half" size={18} color="#FFD700" style={styles.starIcon} />
              <Text style={styles.reviewsText}>Reviews</Text>
            </View>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareProduct}
            >
              <Ionicons name="share-outline" size={20} color="#5D3FD3" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Information */}
          <View style={styles.deliveryInfoContainer}>
            <Ionicons name="bicycle-outline" size={20} color="#5D3FD3" style={styles.deliveryIcon} />
            <Text style={styles.deliveryInfoText}>
              <Text style={styles.deliveryHighlight}>Free Delivery</Text> for orders above GH₵200 {"\n"}
              <Text style={styles.deliveryHighlight}>GH₵5 Delivery Fee</Text> for orders below GH₵200 given your precise location
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {currentProduct.description ||
                "No description available for this product."}
            </Text>
          </View>

          {/* Specifications */}
          <View style={styles.specificationsContainer}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Brand</Text>
              <Text style={styles.specValue}>{currentProduct.brand || "Generic"}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>
                {currentProduct.category || "Electronics"}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Stock Available</Text>
              <Text style={[
                styles.specValue,
                currentProduct.stock > 5 ? styles.inStockText : 
                currentProduct.stock > 0 ? styles.lowStockText : 
                styles.outOfStockText
              ]}>
                {currentProduct.stock || 0} units
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>In Stock</Text>
              <Text style={styles.specValue}>
                {(currentProduct.countInStock === undefined || 
                  currentProduct.countInStock === null || 
                  currentProduct.countInStock > 0) ? "Yes" : "No"}
              </Text>
            </View>
          </View>

          {/* Similar Products */}
          <View style={styles.similarProductsContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>You May Also Like</Text>
              {loadingSimilar ? null : (
                <TouchableOpacity onPress={fetchSimilarProducts}>
                  <Ionicons name="refresh" size={18} color="#5D3FD3" />
                </TouchableOpacity>
              )}
            </View>
            {loadingSimilar ? (
              <ActivityIndicator size="small" color="#5D3FD3" style={styles.similarProductsLoader} />
            ) : similarProducts.length > 0 ? (
              <FlatList
                data={similarProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.similarProductItem}
                    onPress={() => {
                      navigation.push('ProductDetails', { productId: item._id });
                    }}
                  >
                    <Image
                      source={{ uri: item.image || "https://via.placeholder.com/150" }}
                      style={styles.similarProductImage}
                      resizeMode="cover"
                    />
                    <View style={styles.similarProductInfo}>
                      <Text style={styles.similarProductName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.similarProductPrice}>GH₵{item.price?.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noSimilarProductsContainer}>
                <Text style={styles.noSimilarProductsText}>No similar products found</Text>
                <TouchableOpacity 
                  style={styles.findSimilarButton}
                  onPress={fetchSimilarProducts}
                >
                  <Text style={styles.findSimilarButtonText}>Find Similar Products</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Location Map */}
          <View style={styles.mapContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Delivery Location</Text>
              {location && (
                <TouchableOpacity
                  style={styles.locationRefreshButton}
                  onPress={async () => {
                    setLoadingLocation(true);
                    try {
                      let currentLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High,
                      });
                      setLocation(currentLocation);
                      Alert.alert("Success", "Location updated successfully");
                    } catch (error) {
                      Alert.alert("Error", "Failed to update location");
                    } finally {
                      setLoadingLocation(false);
                    }
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#5D3FD3" />
                </TouchableOpacity>
              )}
            </View>
            {loadingLocation ? (
              <View style={styles.mapLoadingContainer}>
                <ActivityIndicator size="large" color="#5D3FD3" />
                <Text style={styles.mapLoadingText}>Getting your location...</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.mapErrorContainer}>
                <Ionicons name="location-outline" size={40} color="#FF6B6B" />
                <Text style={styles.mapErrorText}>{errorMsg}</Text>
                <TouchableOpacity 
                  style={styles.retryLocationButton}
                  onPress={async () => {
                    setLoadingLocation(true);
                    try {
                      // Request permissions again
                      let { status } = await Location.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                        setErrorMsg('Location permission is still denied. Please enable it in settings.');
                        setLoadingLocation(false);
                        return;
                      }
                      
                      // Try to get location with high accuracy
                      let currentLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High,
                        timeout: 15000, // 15 second timeout
                      });
                      
                      setLocation(currentLocation);
                      setErrorMsg(null);
                      Alert.alert("Success", "Location updated successfully");
                    } catch (error) {
                      console.error('Error getting location on retry:', error);
                      setErrorMsg('Still unable to get your location. Please check your device settings.');
                    } finally {
                      setLoadingLocation(false);
                    }
                  }}
                >
                  <Text style={styles.retryLocationButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : location ? (
              <View style={styles.mapWrapper}>
                <View style={styles.staticMapContainer}>
                  <View style={styles.customMapBackground}>
                    <View style={styles.customMapGrid}>
                      <View style={styles.customMapRoad} />
                      <View style={[styles.customMapRoad, { transform: [{ rotate: '90deg' }] }]} />
                      {/* Add some additional map details */}
                      <View style={[styles.customMapRoad, { width: '30%', left: '10%', top: '30%', height: 10 }]} />
                      <View style={[styles.customMapRoad, { width: '20%', left: '60%', top: '70%', height: 10 }]} />
                      <View style={[styles.customMapRoad, { width: 10, height: '25%', left: '70%', top: '20%' }]} />
                      <View style={[styles.customMapRoad, { width: 10, height: '15%', left: '30%', top: '60%' }]} />
                      
                      {/* Add some buildings */}
                      <View style={styles.customMapBuilding1} />
                      <View style={styles.customMapBuilding2} />
                      <View style={styles.customMapBuilding3} />
                    </View>
                    
                    {/* Animated Pulse Effects */}
                    <Animated.View 
                      style={[
                        styles.mapMarkerPulseOuter,
                        {
                          opacity: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.1, 0.3]
                          }),
                          transform: [{
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.3]
                            })
                          }]
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.mapMarkerPulse,
                        {
                          opacity: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 0.5]
                          }),
                          transform: [{
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2]
                            })
                          }]
                        }
                      ]} 
                    />
                    <View style={styles.mapMarker}>
                      <Ionicons name="location" size={32} color="#5D3FD3" />
                    </View>
                  </View>
                  <Text style={styles.locationText}>Your Current Location</Text>
                </View>

                <View style={styles.mapOverlay}>
                  <Text style={styles.deliveryAddressLabel}>Delivery to this location:</Text>
                  <Text style={styles.deliveryAddressCoords}>
                    ({location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)})
                  </Text>
                  <View style={styles.deliveryStatusContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.deliveryStatusText}>Delivery available to this location</Text>
                  </View>
                  
                  <View style={styles.deliveryEstimateContainer}>
                    <View style={styles.deliveryEstimateItem}>
                      <Ionicons name="cash-outline" size={16} color="#5D3FD3" />
                      <Text style={styles.deliveryEstimateLabel}>Delivery Cost:</Text>
                      <Text style={styles.deliveryEstimateValue}>
                        GH₵{calculateDeliveryCost(location)}
                      </Text>
                    </View>
                    <View style={styles.deliveryEstimateItem}>
                      <Ionicons name="time-outline" size={16} color="#5D3FD3" />
                      <Text style={styles.deliveryEstimateLabel}>Estimated Time:</Text>
                      <Text style={styles.deliveryEstimateValue}>
                        {estimateDeliveryTime(location)} mins
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.changeLocationButton}
                    onPress={() => {
                      // Show a confirmation dialog
                      Alert.alert(
                        "Confirm Delivery Location",
                        "Would you like to set this as your delivery location?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Confirm",
                            onPress: () => Alert.alert("Success", "Delivery location confirmed!")
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.changeLocationButtonText}>Confirm Location</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.mapErrorContainer}>
                <Text style={styles.mapErrorText}>Location not available</Text>
              </View>
            )}
          </View>

        
        </View>

                {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Reviews ({comments.length})</Text>
          
          {loadingComments ? (
            <ActivityIndicator size="small" color="#5D3FD3" style={styles.loader} />
          ) : commentError ? (
            <Text style={styles.errorText}>{commentError}</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No reviews yet. Be the first to review!</Text>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((item) => (
                <View key={item._id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      <Text style={styles.commentAuthor}>{item.user.name}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {item.rating && (
                      <View style={styles.commentRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= item.rating ? "star" : "star-outline"}
                            size={14}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Comment Input */}
          <View style={styles.commentInputSection}>
            <Text style={styles.commentInputTitle}>Write a Review</Text>
            
            {/* Rating Selection */}
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                >
                  <Ionicons
                    name={star <= selectedRating ? "star" : "star-outline"}
                    size={24}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Comment Input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={3}
            />
            
            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitCommentButton,
                (!commentText.trim() || selectedRating === 0) && styles.submitCommentButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || selectedRating === 0}
            >
              <Text style={styles.submitCommentButtonText}>Post Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>
          GH₵{(currentProduct.price * quantity).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>Add to Cart</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: "#5D3FD3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
    marginTop: Platform.OS === 'android' ? 16 : 10,

  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#fff",
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 16,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
    marginBottom: 12
  },
  paginationDotActive: {
    backgroundColor: "#fff",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  productInfoContainer: {
    backgroundColor: "#fff",
 
    marginTop: -20,
    padding: 20,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productName: {
    fontSize: 20,
    color: "#333",
    // marginRight: 10,
  },
  stockStatusContainer: {
    marginBottom: 8,
  },
  stockStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockStatusText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  inStockText: {
    color: '#4CAF50',
  },
  lowStockText: {
    color: '#FFC107',
  },
  outOfStockText: {
    color: '#F44336',
  },
  ratingStarsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  starIcon: {
    marginHorizontal: 2,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5D3FD3",
    alignSelf: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 16,
    color: "#333",
    marginRight: 12,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 8,
    color: "#333",
  },
  descriptionContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
  },
  specificationsContainer: {
    marginVertical: 16,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  specLabel: {
    fontSize: 14,
    color: "#666",
  },
  specValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  sellerContainer: {
    marginVertical: 16,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
  },
  sellerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  sellerRating: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  contactButton: {
    backgroundColor: "#5D3FD3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5D3FD3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    borderRadius: 12,
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  commentsList: {
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentRating: {
    flexDirection: 'row',
  },
  commentText: {
    color: '#666',
    lineHeight: 20,
  },
  commentInputSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  commentInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitCommentButton: {
    backgroundColor: '#5D3FD3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitCommentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitCommentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullscreenImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenPaginationContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  fullscreenPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  fullscreenPaginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contactModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  contactModalContent: {
    padding: 20,
  },
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shareButtonText: {
    fontSize: 14,
    color: '#5D3FD3',
    fontWeight: '500',
    marginLeft: 4,
  },
  slideshowControlButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  slideshowIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  slideshowIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  imageSlide: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#f0f0ff',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5D3FD3',
  },
  deliveryIcon: {
    marginRight: 8,
  },
  deliveryInfoText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  deliveryHighlight: {
    fontWeight: 'bold',
  },
  priceQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarProductsContainer: {
    marginVertical: 16,
  },
  similarProductItem: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  similarProductImage: {
    width: '100%',
    height: 150,
  },
  similarProductInfo: {
    padding: 8,
  },
  similarProductName: {
    fontSize: 14,
    color: '#333',
    height: 20,
  },
  similarProductPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D3FD3',
  },
  similarProductsLoader: {
    padding: 20,
  },
  noSimilarProductsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  noSimilarProductsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  findSimilarButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  findSimilarButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  mapContainer: {
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  mapWrapper: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  staticMapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customMapBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    overflow: 'hidden',
  },
  customMapGrid: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  customMapRoad: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginTop: -10,
  },
  customMapBuilding1: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#d0d0d0',
    top: '25%',
    left: '25%',
    borderRadius: 2,
  },
  customMapBuilding2: {
    position: 'absolute',
    width: 40,
    height: 25,
    backgroundColor: '#d0d0d0',
    top: '60%',
    left: '75%',
    borderRadius: 2,
  },
  customMapBuilding3: {
    position: 'absolute',
    width: 35,
    height: 35,
    backgroundColor: '#d0d0d0',
    top: '35%',
    left: '65%',
    borderRadius: 2,
  },
  mapMarkerPulseOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
  },
  mapMarkerPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(93, 63, 211, 0.2)',
    top: '50%',
    left: '50%',
    marginLeft: -35,
    marginTop: -35,
  },
  mapMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    zIndex: 10,
  },
  locationText: {
    position: 'absolute',
    bottom: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  staticMapImage: {
    width: '100%',
    height: '100%',
  },
  mapLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  mapLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  mapErrorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  mapErrorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryLocationButton: {
    marginTop: 16,
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryLocationButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  deliveryAddressLabel: {
    fontSize: 12,
    color: '#666',
  },
  deliveryAddressCoords: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  deliveryStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryStatusText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  locationRefreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  deliveryEstimateContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  deliveryEstimateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  deliveryEstimateLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
    width: 105,
  },
  deliveryEstimateValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  changeLocationButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLocationButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
});

export default ProductDetailsScreen;
