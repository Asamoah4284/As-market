import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { handleAddToCartNotification } from './notificationService';

const PRODUCTS_URL = `${API_BASE_URL}/api/products`;

export const productService = {
  // Fetch all products
  fetchProducts: async () => {
    try {
      const response = await fetch(PRODUCTS_URL);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Fetch products by category
  fetchProductsByCategory: async (categoryId, categoryName) => {
    try {
      const response = await fetch(PRODUCTS_URL);
      if (response.ok) {
        const products = await response.json();
        
        // Filter products by category name (case-insensitive)
        const filteredProducts = products.filter(product => {
          const matchesCategory = 
            (product.category && product.category.toLowerCase() === categoryName.toLowerCase()) ||
            (product.mainCategory && product.mainCategory.toLowerCase() === categoryName.toLowerCase()) ||
            (product.subcategory && product.subcategory.toLowerCase() === categoryName.toLowerCase());

          return matchesCategory && !product.isService;
        });

        return filteredProducts;
      } else {
        throw new Error('Failed to fetch category products');
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (query) => {
    try {
      const response = await fetch(PRODUCTS_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const allProducts = await response.json();
      
      // Filter products by name (case-insensitive)
      const filteredProducts = allProducts.filter(product => {
        const productName = product.name ? product.name.toLowerCase() : '';
        const productDescription = product.description ? product.description.toLowerCase() : '';
        const productCategory = product.category ? product.category.toLowerCase() : '';
        const productSubcategory = product.subcategory ? product.subcategory.toLowerCase() : '';
        const searchTerm = query.toLowerCase();
        
        return productName.includes(searchTerm) || 
               productDescription.includes(searchTerm) || 
               productCategory.includes(searchTerm) ||
               productSubcategory.includes(searchTerm);
      });

      return filteredProducts;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  // Add to cart
  addToCart: async (product, dispatch) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Check if product has stock available
      if (product.stock <= 0) {
        Alert.alert('Out of Stock', 'This product is currently out of stock.');
        return false;
      }
      
      // Make API call to add to cart
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      });
      
      if (response.ok) {
        // Send notification
        await handleAddToCartNotification(product.name, dispatch);
        Alert.alert('Success', 'Product added to cart');
        return true;
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add product to cart');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
      return false;
    }
  },

  // Increment product views
  incrementViews: async (productId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('View increment failed:', response.status, errorText);
        return null;
      } else {
        const data = await response.json();
        console.log('View response:', data.message, 'Current views:', data.views);
        return data.views;
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      return null;
    }
  },
}; 