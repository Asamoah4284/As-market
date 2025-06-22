import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config/api';
import * as Speech from 'expo-speech';

const FEATURED_PRODUCTS = [
  {
    _id: '1',
    name: 'Premium Headphones',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.8,
  },
  {
    _id: '2',
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.5,
  },
  {
    _id: '3',
    name: 'Wireless Earbuds',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.7,
  },
  {
    _id: '4',
    name: 'Bluetooth Speaker',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.6,
  },
];

let url = `${API_BASE_URL}/api/products`;

export const useProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingNewArrivals, setIsLoadingNewArrivals] = useState(true);
  const searchTimeoutRef = useRef(null);

  // Automatically fetch products when hook is initialized
  useEffect(() => {
    console.log('useProducts hook initialized, fetching data...');
    fetchProducts();
    fetchServices();
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setIsLoadingNewArrivals(true);
    try {
      console.log('Fetching products from:', `${url}`);
      const response = await fetch(`${url}`);
      console.log('Products API Response Status:', response.status);
      
      if (response.ok) {
        const products = await response.json();
        console.log('Fetched products count:', products.length);
        console.log('Sample product:', products[0]);
        
        // Log creation dates for debugging
        const productsWithDates = products.map(product => ({
          ...product,
          createdAt: product.createdAt || product.created_at || new Date().toISOString()
        }));
        
        console.log('Products with creation dates:');
        productsWithDates.slice(0, 3).forEach((product, index) => {
          console.log(`Product ${index + 1}: ${product.name} - Created: ${product.createdAt}`);
        });
        
        const nonServiceProducts = productsWithDates.filter(product => product.isService !== true);
        console.log('Non-service products count:', nonServiceProducts.length);
        
        // Sort by creation date (newest first)
        const sortedProducts = nonServiceProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        console.log('Sorted products (newest first):');
        sortedProducts.slice(0, 3).forEach((product, index) => {
          console.log(`Sorted ${index + 1}: ${product.name} - Created: ${product.createdAt}`);
        });
        
        setFeaturedProducts(sortedProducts);
      } else {
        console.log('Using mock data due to API failure');
        setFeaturedProducts(FEATURED_PRODUCTS);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      console.log('Using mock data due to error');
      setFeaturedProducts(FEATURED_PRODUCTS);
    } finally {
      // Simulate minimum loading time for better UX
      setTimeout(() => {
        setIsLoadingProducts(false);
        setIsLoadingNewArrivals(false);
        console.log('Loading states set to false');
      }, 1000);
    }
  };

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await fetch(`${url}`);
      console.log('Services API Response Status:', response.status);
      
      if (response.ok) {
        const products = await response.json();
        const serviceProducts = products.filter(product => 
          product.isService === true || product.featuredType === 'featured-service'
        );
        console.log('Filtered services count:', serviceProducts.length);
        setServices(serviceProducts);
      } else {
        console.log('Failed to fetch services');
        setServices([]); // Set empty array if fetch fails
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]); // Set empty array on error
    } finally {
      setTimeout(() => {
        setIsLoadingServices(false);
      }, 1000);
    }
  };

  const handleSearch = async (query) => {
    // If query is empty, return early
    if (!query.trim()) {
      return;
    }

    try {
      // Fetch all products from backend
      const response = await fetch(`${url}`);
      
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
        
        // Check if product name, description, category, or subcategory contains the search term
        return productName.includes(searchTerm) || 
               productDescription.includes(searchTerm) || 
               productCategory.includes(searchTerm) ||
               productSubcategory.includes(searchTerm);
      });

      console.log(`Found ${filteredProducts.length} products matching "${query}"`);
      
      // Update the featured products with search results
      setFeaturedProducts(filteredProducts);
      
      // Optional: Text-to-speech feedback
      if (filteredProducts.length > 0) {
        Speech.speak(`Found ${filteredProducts.length} matching products`);
      } else {
        Speech.speak('No products found');
      }

    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Search Error', 'Failed to search products. Please try again.');
    }
  };

  const fetchOriginalProducts = async () => {
    try {
      const response = await fetch(`${url}`);
      if (response.ok) {
        const products = await response.json();
        const nonServiceProducts = products.filter(product => product.isService !== true);
        setFeaturedProducts(nonServiceProducts);
      }
    } catch (error) {
      console.error('Error fetching original products:', error);
    }
  };

  const fetchProductsByCategory = async (categoryId, categoryName) => {
    setIsLoadingProducts(true);
    try {
      // Fetch all products first
      const response = await fetch(`${url}`);
      console.log('Products API Response Status:', response.status);
      
      if (response.ok) {
        const products = await response.json();
        console.log('Fetched products:', products);
        
        // Filter products by category name (case-insensitive)
        const filteredProducts = products.filter(product => {
          // Check if product matches the category in any of these fields
          const matchesCategory = 
            (product.category && product.category.toLowerCase() === categoryName.toLowerCase()) ||
            (product.mainCategory && product.mainCategory.toLowerCase() === categoryName.toLowerCase()) ||
            (product.subcategory && product.subcategory.toLowerCase() === categoryName.toLowerCase());

          // Only include non-service products
          return matchesCategory && !product.isService;
        });

        console.log(`Found ${filteredProducts.length} products in category ${categoryName}`);
        
        if (filteredProducts.length === 0) {
          Alert.alert(
            'No Products Found',
            `No products found in the ${categoryName} category.`,
            [{ text: 'OK' }]
          );
        }

        return filteredProducts;
      } else {
        console.log('Failed to fetch category products');
        Alert.alert(
          'Error',
          'Failed to fetch products. Please try again.',
          [{ text: 'OK' }]
        );
        return [];
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      Alert.alert(
        'Error',
        'An error occurred while fetching products. Please try again.',
        [{ text: 'OK' }]
      );
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    featuredProducts,
    setFeaturedProducts,
    services,
    isLoadingProducts,
    isLoadingServices,
    isLoadingNewArrivals,
    searchTimeoutRef,
    fetchProducts,
    fetchServices,
    handleSearch,
    fetchOriginalProducts,
    fetchProductsByCategory,
  };
};