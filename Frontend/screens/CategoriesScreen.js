import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const CategoryScreen = ({ route, navigation }) => {
  // Add default values to prevent undefined errors
  const { 
    categoryId = '1', 
    categoryName = 'Products', 
    featuredOnly = false, 
    newArrivals = false,
    services = false
  } = route?.params || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let endpoint = 'http://172.20.10.3:5000/api/products';
        
        if (featuredOnly) {
          // Featured products endpoint
          endpoint = 'http://172.20.10.3:5000/api/products/featured';
        } else if (categoryId !== '1' && !isNaN(parseInt(categoryId))) {
          // If categoryId is a valid numeric ID, use category specific endpoint
          endpoint = `http://172.20.10.3:5000/api/products/category/${categoryId}`;
        }
        
        console.log('Fetching products from:', endpoint);
        
        const response = await fetch(endpoint);
        
        if (response.ok) {
          let data = await response.json();
          console.log('Fetched products:', data);
          
          // Filter based on the section type
          if (services) {
            data = data.filter(product => 
              product.isService === true || product.featuredType === 'featured-service'
            );
          } else if (newArrivals) {
            // Sort by date, assuming there's a createdAt field, to get newest products
            data = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
          } else if (!featuredOnly && !services && categoryId === '1') {
            // Filter out services from regular product lists
            data = data.filter(product => product.isService !== true);
          } else if (categoryId !== '1' && isNaN(parseInt(categoryId))) {
            // Filter by name for trend categories (when categoryId is not a number)
            // This handles trending categories like 'men', 'women', 'kids', etc.
            const categoryNameLower = categoryName.toLowerCase();
            data = data.filter(product => {
              // Check if product name or description contains the category name
              const nameMatches = product.name && 
                product.name.toLowerCase().includes(categoryNameLower);
              const descMatches = product.description && 
                product.description.toLowerCase().includes(categoryNameLower);
              const categoryMatches = product.category && 
                product.category.toLowerCase().includes(categoryNameLower);
              const tagsMatch = product.tags && 
                product.tags.some(tag => tag.toLowerCase().includes(categoryNameLower));
              
              return nameMatches || descMatches || categoryMatches || tagsMatch;
            });
          }
          
          setProducts(data);
        } else {
          console.error('Error response:', response.status);
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryId, categoryName, featuredOnly, services, newArrivals]);

  const renderProductItem = ({ item }) => {
    // Handle proper image path
    const imageUri = item.image && (item.image.startsWith('http') 
      ? item.image 
      : `http://172.20.10.3:5000${item.image}`);
    
    // Determine if the product is on sale (example condition)
    const isOnSale = item.discountPercentage && item.discountPercentage > 0;
    
    // Make sure price is a number before calling toFixed
    const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
    const originalPrice = isOnSale && typeof item.originalPrice === 'number' ? 
      item.originalPrice.toFixed(2) : '0.00';
    
    return (
      <TouchableOpacity 
        style={styles.productItem}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.productImage}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          />
          {isOnSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>-{item.discountPercentage}%</Text>
            </View>
          )}
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={22} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
            {item.name || 'Product Name'}
          </Text>
          
          {/* Rating */}
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              {item.numReviews && (
                <Text style={styles.reviewCount}>({item.numReviews})</Text>
              )}
            </View>
          )}
          
          {/* Price section */}
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${price}</Text>
            {isOnSale && item.originalPrice && (
              <Text style={styles.originalPrice}>${originalPrice}</Text>
            )}
          </View>
          
          {/* Stock status or service indicator */}
          {item.isService ? (
            <Text style={styles.serviceTag}>Service</Text>
          ) : (
            (item.countInStock === undefined || item.countInStock === null || item.countInStock > 0) ? (
              <Text style={styles.inStock}>In Stock</Text>
            ) : (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )
          )}
          
          {/* Add to cart button */}
          <TouchableOpacity style={styles.addToCartButton}>
            <Ionicons name="cart-outline" size={16} color="#fff" />
            <Text style={styles.addToCartText}>Add</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  // Determine the correct title based on parameters
  const getScreenTitle = () => {
    if (featuredOnly) return "Featured Products";
    if (services) return "Services";
    if (newArrivals) return "New Arrivals";
    return categoryName || "Products";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {getScreenTitle()}
        </Text>
        <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={70} color="#ddd" />
          <Text style={styles.emptyStateTitle}>No Products Found</Text>
          <Text style={styles.emptyStateText}>
            We couldn't find any products matching "{categoryName || 'this category'}".
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('CategoriesScreen')}
          >
            <Text style={styles.browseButtonText}>Browse All Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key="two-column-grid"
          data={products}
          keyExtractor={(item) => item._id ? item._id.toString() : Math.random().toString()}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#5D3FD3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
    height: Platform.OS === 'android' ? 60 : 'auto',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  listContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    backgroundColor: '#fff',
    // borderRadius: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 20,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#888',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 5,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  serviceTag: {
    fontSize: 12,
    color: '#6a5acd',
    marginBottom: 8,
    fontWeight: '500',
  },
  inStock: {
    fontSize: 12,
    color: '#2ecc71',
    marginBottom: 8,
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 8,
    fontWeight: '500',
  },
  addToCartButton: {
    backgroundColor: '#5D3FD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    // borderRadius: 10,
    marginTop: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryScreen;
