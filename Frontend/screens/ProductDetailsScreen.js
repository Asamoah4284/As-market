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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        console.log("Fetching product with ID:", productId);

        const response = await fetch(
          `http://172.20.10.3:5000/api/products/${productId}`
        );

        if (!response.ok) {
          console.error(
            "API response not OK:",
            response.status,
            response.statusText
          );
          throw new Error("Failed to fetch product details");
        }

        const data = await response.json();
        // Combine main image with additional images for the carousel
        const allImages = [data.image, ...(data.additionalImages || [])].filter(Boolean);
        data.images = allImages;
        console.log("Product details:", data);
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Could not load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    fetchComments(); // Add this to fetch comments when component loads
  }, [productId]);

  // Add function to fetch comments
  const fetchComments = async () => {
    try {
      const response = await fetch(
        `http://172.20.10.3:5000/api/products/${productId}/comments`
      );

      if (!response.ok) {
        console.error("Failed to fetch comments:", response.status);
        return;
      }

      const data = await response.json();
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
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

      const response = await fetch(
        `http://172.20.10.3:5000/api/products/${productId}/comments`,
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

      const response = await fetch("http://172.20.10.3:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Product added to cart successfully!");
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

  if (loading) {
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
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!product) {
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
            data={product?.images || []}
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
            {(product?.images || []).map((_, index) => (
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
          {product.images && product.images.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={product.images}
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
                    style={{ width: windowWidth }}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri: item }}
                      style={styles.productImage}
                      resizeMode="cover"
                      onError={(e) =>
                        console.log("Image loading error:", e.nativeEvent.error)
                      }
                    />
                  </TouchableOpacity>
                )}
              />
              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {product.images.map((_, index) => (
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
                        index === activeImageIndex &&
                          styles.paginationDotActive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            // Fallback to single image if images array is not available
            <Image
              source={{
                uri: product.image || "https://via.placeholder.com/400",
              }}
              style={styles.productImage}
              resizeMode="cover"
              onError={(e) =>
                console.log("Image loading error:", e.nativeEvent.error)
              }
            />
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating || 4.5}</Text>
              <Text style={styles.reviewsText}>(120 reviews)</Text>
            </View>
          </View>

          <Text style={styles.productPrice}>${product.price?.toFixed(2)}</Text>

          {/* Quantity Selector */}
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

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {product.description ||
                "No description available for this product."}
            </Text>
          </View>

          {/* Specifications */}
          <View style={styles.specificationsContainer}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Brand</Text>
              <Text style={styles.specValue}>{product.brand || "Generic"}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>
                {product.category || "Electronics"}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>In Stock</Text>
              <Text style={styles.specValue}>
                {product.countInStock > 0 ? "Yes" : "No"}
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerInfo}>
              <Ionicons name="person-circle-outline" size={40} color="#666" />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>
                  {product.seller?.name || "Marketplace Seller"}
                </Text>
                <Text style={styles.sellerRating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  {product.seller?.rating || "4.8"} Seller Rating
                </Text>
              </View>
              <TouchableOpacity style={styles.contactButton}>
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
                    {new Date(comment.createdAt).toLocaleDateString()}
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
            ${(product.price * quantity).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5D3FD3",
    marginVertical: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
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
});

export default ProductDetailsScreen;
