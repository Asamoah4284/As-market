import React, { useState, useEffect } from "react";
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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../store/slices/productSlice';
import * as Location from 'expo-location';

const API_URL = 'http://172.20.10.3:5000';

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const dispatch = useDispatch();
  const { currentProduct, isLoading, error } = useSelector((state) => state.products);

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const windowWidth = Dimensions.get("window").width;
  const flatListRef = React.useRef(null);

  // Add new state for comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }
  }, [dispatch, productId]);

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
      const apiUrl = API_URL.startsWith('http') ? API_URL : `http://${API_URL}`;
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

  // Add function to fetch comments
  const fetchComments = async () => {
    try {
      console.log("Fetching comments for product:", productId);
      
      // Use the consistent API URL pattern that works
      const apiUrl = API_URL.startsWith('http') ? API_URL : `http://${API_URL}`;
      const response = await fetch(
        `${apiUrl}/api/products/${productId}/comments`
      );

      if (!response.ok) {
        console.error("Failed to fetch comments:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Comments data:", data);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      // Show a message to the user
      Alert.alert(
        "Comments Unavailable",
        "Couldn't load comments at this time. Please try again later."
      );
    }
  };

  // Add function to submit a new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert("Sign In Required", "Please sign in to post a comment", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => navigation.navigate("Login") },
        ]);
        return;
      }

      // Use the consistent API URL pattern
      const apiUrl = API_URL.startsWith('http') ? API_URL : `http://${API_URL}`;
      const response = await fetch(
        `${apiUrl}/api/products/${productId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: newComment,
          }),
        }
      );

      if (response.ok) {
        const newCommentData = await response.json();
        setComments([...comments, newCommentData]);
        setNewComment("");
        Alert.alert("Success", "Your comment has been posted!");
        // Refresh comments to ensure we have the latest
        fetchComments();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert(
          "Sign In Required",
          "Please sign in to add items to your cart",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => navigation.navigate("Login") },
          ]
        );
        return;
      }

      // Add a local loading state for the button
      // Use the consistent API URL pattern
      const apiUrl = API_URL.startsWith('http') ? API_URL : `http://${API_URL}`;
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
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  // Add this function to handle image press
  const handleImagePress = (index) => {
    setActiveImageIndex(index);
    setIsFullscreen(true);
  };

  // Add function to handle contact seller
  const handleContactSeller = () => {
    setContactModalVisible(true);
  };

  // Add function to open WhatsApp
  const contactViaWhatsApp = () => {
    // You can customize the message or use seller's phone if available
    const phoneNumber = currentProduct.seller?.phone || "1234567890";
    const message = `Hello, I'm interested in your product: ${currentProduct.name}`;
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert("WhatsApp not installed", "Please install WhatsApp to contact the seller.");
        }
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
    
    setContactModalVisible(false);
  };

  // Add function to view seller profile
  const viewSellerProfile = () => {
    // Navigate to seller profile screen if available
    if (currentProduct.seller?._id) {
      navigation.navigate('SellerProfile', { sellerId: currentProduct.seller._id });
    } else {
      Alert.alert("Seller Profile", "Seller profile is not available.");
    }
    setContactModalVisible(false);
  };

  // Add utility functions for delivery estimation
  const calculateDeliveryCost = (location) => {
    // Simple example calculation - could be more complex with real data
    // For this example, we'll use the distance from a fixed point (e.g., store location)
    const storeLatitude = 5.6037; // Example store location in Ghana
    const storeLongitude = -0.1870;
    
    // Calculate rough distance using Haversine formula
    const distance = calculateDistance(
      storeLatitude, 
      storeLongitude,
      location.coords.latitude,
      location.coords.longitude
    );
    
    // Base delivery fee GH₵5
    let deliveryFee = 5;
    
    // Add GH₵1 for each additional km after first 2 km
    if (distance > 2) {
      deliveryFee += Math.ceil(distance - 2);
    }
    
    // Cap the delivery fee at GH₵10
    deliveryFee = Math.min(deliveryFee, 10);
    
    return deliveryFee.toFixed(2);
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
                <Image
                  source={{ uri: item }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
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
                <Ionicons name="person" size={24} color="#5D3FD3" />
                <Text style={styles.contactOptionText}>View Seller's Profile</Text>
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
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Product Image Carousel */}
        <View style={styles.imageContainer}>
          {currentProduct?.additionalImages && Array.isArray(currentProduct.additionalImages) && currentProduct.additionalImages.length > 0 ? (
            <>
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
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    style={[styles.imageSlide, { width: windowWidth }]}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri: item }}
                      style={styles.productImage}
                      resizeMode="cover"
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
            </>
          ) : (
            // Fallback to single image
            <Image
              source={{
                uri: currentProduct?.image || "https://via.placeholder.com/400",
              }}
              style={styles.productImage}
              resizeMode="cover"
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
            {currentProduct.countInStock > 5 ? (
              <View style={styles.stockStatusIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.stockStatusText, styles.inStockText]}>In Stock</Text>
              </View>
            ) : currentProduct.countInStock > 0 ? (
              <View style={styles.stockStatusIndicator}>
                <Ionicons name="alert-circle" size={16} color="#FFC107" />
                <Text style={[styles.stockStatusText, styles.lowStockText]}>Low Stock</Text>
              </View>
            ) : (
              <View style={styles.stockStatusIndicator}>
                <Ionicons name="close-circle" size={16} color="#F44336" />
                <Text style={[styles.stockStatusText, styles.outOfStockText]}>Out of Stock</Text>
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
                <Text style={styles.quantityValue}>{quantity}</Text>
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
            <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
            <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
            <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
            <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
            <Ionicons name="star" size={18} color="#FFD700" style={styles.starIcon} />
            <Text style={styles.reviewsText}>(120 reviews)</Text>
          </View>

          {/* Delivery Information */}
          <View style={styles.deliveryInfoContainer}>
            <Ionicons name="bicycle-outline" size={20} color="#5D3FD3" style={styles.deliveryIcon} />
            <Text style={styles.deliveryInfoText}>
              <Text style={styles.deliveryHighlight}>Free Delivery</Text> for orders below GH₵50 {"\n"}
              <Text style={styles.deliveryHighlight}>GH₵5 and above Delivery Fee</Text> for orders  above GH₵50 given your precise location
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
              <Text style={styles.specLabel}>In Stock</Text>
              <Text style={styles.specValue}>
                {currentProduct.countInStock > 0 ? "Yes" : "No"}
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

          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerInfo}>
              <Ionicons name="person-circle-outline" size={40} color="#666" />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>
                  {currentProduct.seller?.name || "Marketplace Seller"}
                </Text>
                <Text style={styles.sellerRating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  {currentProduct.seller?.rating || "4.8"} Seller Rating
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactSeller}
              >
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Add Comments Section */}
        <View style={styles.commentsContainer}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitCommentButton,
                submittingComment && styles.disabledButton,
              ]}
              onPress={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitCommentText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <View key={comment._id || index} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUser}>
                    <Ionicons name="person-circle" size={24} color="#666" />
                    <Text style={styles.commentUsername}>
                      {comment.user?.name || "Anonymous"}
                    </Text>
                  </View>
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>
              Be the first to leave a review for this product!
            </Text>
          )}
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
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
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
    marginVertical: 5,
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
  quantityValue: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
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
  commentsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  commentInputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitCommentButton: {
    backgroundColor: "#5D3FD3",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#9d89e3",
  },
  submitCommentText: {
    color: "#fff",
    fontWeight: "bold",
  },
  commentItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  noCommentsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
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
