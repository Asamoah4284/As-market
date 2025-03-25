import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // In a real app, fetch product details from API
  useEffect(() => {
    // Mock API call - replace with actual API
    const fetchProductDetails = () => {
      setLoading(true);
      
      // This is a mock implementation - in a real app, you would fetch from your API
      // using the productId parameter
      const mockProducts = [
        {
          id: '1',
          name: 'Premium Headphones',
          price: 129.99,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          rating: 4.8,
          description: 'High-quality wireless headphones with noise cancellation technology. Experience crystal clear sound and comfort for extended listening sessions.',
          features: [
            'Active Noise Cancellation',
            'Bluetooth 5.0',
            '30-hour battery life',
            'Comfortable ear cushions',
            'Built-in microphone'
          ],
          inStock: true,
          reviews: 128,
        },
        {
          id: '2',
          name: 'Smart Watch',
          price: 199.99,
          image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          rating: 4.5,
          description: 'Advanced smartwatch with health tracking features, notifications, and customizable watch faces. Stay connected and monitor your fitness goals.',
          features: [
            'Heart rate monitoring',
            'Sleep tracking',
            'Water resistant',
            'Customizable watch faces',
            'Notification alerts'
          ],
          inStock: true,
          reviews: 95,
        },
        {
          id: '3',
          name: 'Wireless Earbuds',
          price: 89.99,
          image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          rating: 4.7,
          description: 'True wireless earbuds with premium sound quality and comfortable fit. Perfect for workouts and everyday use with long battery life.',
          features: [
            'True wireless design',
            'Touch controls',
            'IPX7 waterproof',
            '24-hour battery with case',
            'Noise isolation'
          ],
          inStock: true,
          reviews: 112,
        },
        {
          id: '4',
          name: 'Bluetooth Speaker',
          price: 79.99,
          image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          rating: 4.6,
          description: 'Portable Bluetooth speaker with powerful sound and deep bass. Take your music anywhere with this durable, water-resistant speaker.',
          features: [
            '360° sound',
            'Water resistant',
            '12-hour playtime',
            'Built-in microphone',
            'Compact design'
          ],
          inStock: true,
          reviews: 87,
        },
      ];
      
      // Find the product with the matching ID
      const foundProduct = mockProducts.find(p => p.id === productId);
      
      // Simulate network delay
      setTimeout(() => {
        if (foundProduct) {
          setProduct(foundProduct);
        }
        setLoading(false);
      }, 800);
    };

    fetchProductDetails();
  }, [productId]);

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // Implement add to cart functionality
    alert(`Added ${quantity} item(s) to cart`);
  };

  const handleBuyNow = () => {
    // Navigate to checkout
    navigation.navigate('Checkout', { product, quantity });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="heart-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
        </View>
        
        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
            <Text style={styles.reviewsText}>({product.reviews} reviews)</Text>
          </View>
          
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={handleDecreaseQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#333"} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={handleIncreaseQuantity}
              >
                <Ionicons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
          
          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            {product.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#5D3FD3" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.addToCartButton]}
          onPress={handleAddToCart}
        >
          <Ionicons name="cart-outline" size={20} color="#5D3FD3" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyNowButton]}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLink: {
    color: '#5D3FD3',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3FD3',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 8,
    width: 36,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  addToCartButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D3FD3',
    marginLeft: 8,
  },
  buyNowButton: {
    backgroundColor: '#5D3FD3',
    marginLeft: 8,
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ProductDetailsScreen; 