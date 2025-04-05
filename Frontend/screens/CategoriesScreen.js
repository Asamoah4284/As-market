import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Mock data - replace with your actual API call
const PRODUCTS = {
  '1': [
    { id: 'e1', name: 'Smartphone X', price: 799.99, image: 'https://via.placeholder.com/150' },
    { id: 'e2', name: 'Wireless Earbuds', price: 129.99, image: 'https://via.placeholder.com/150' },
    { id: 'e3', name: 'Smart Watch', price: 249.99, image: 'https://via.placeholder.com/150' },
    { id: 'e4', name: 'Laptop Pro', price: 1299.99, image: 'https://via.placeholder.com/150' },
    { id: 'e5', name: 'Bluetooth Speaker', price: 79.99, image: 'https://via.placeholder.com/150' },
  ],
  '2': [
    { id: 'c1', name: 'Casual T-Shirt', price: 24.99, image: 'https://via.placeholder.com/150' },
    { id: 'c2', name: 'Denim Jeans', price: 49.99, image: 'https://via.placeholder.com/150' },
    { id: 'c3', name: 'Winter Jacket', price: 89.99, image: 'https://via.placeholder.com/150' },
  ],
  // Add more categories as needed
};

const CategoryScreen = ({ route, navigation }) => {
  // Add default values to prevent undefined errors
  const { categoryId = '1', categoryName = 'Products', featuredOnly = false } = route?.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let endpoint;
        
        if (featuredOnly) {
          // Endpoint for featured products
          endpoint = 'http://172.20.10.3:5000/api/products/featured';
        } else {
          // Endpoint for category products
          endpoint = `http://172.20.10.3:5000/api/products/category/${categoryId}`;
        }
        
        console.log('Fetching products from:', endpoint);
        
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched products:', data);
          setProducts(data);
        } else {
          console.error('Error response:', response.status);
          // Fallback to mock data if API fails
          setProducts(PRODUCTS[categoryId] || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock data if API fails
        setProducts(PRODUCTS[categoryId] || []);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryId, featuredOnly]);

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      <TouchableOpacity style={styles.addToCartButton}>
        <Ionicons name="add-circle" size={24} color="#3498db" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {featuredOnly ? "Featured Products" : categoryName}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>No products found in this category</Text>
        </View>
      ) : (
        <FlatList
          key="two-column-grid"
          data={products}
          keyExtractor={(item) => item.id}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
    textAlign: 'center',
  },
  addToCartButton: {
    marginTop: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default CategoryScreen;
