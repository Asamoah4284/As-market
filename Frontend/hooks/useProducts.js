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
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingNewArrivals, setIsLoadingNewArrivals] = useState(true);
  const [isLoadingTrendingProducts, setIsLoadingTrendingProducts] = useState(true);
  const searchTimeoutRef = useRef(null);

  // Automatically fetch products when hook is initialized
  useEffect(() => {
    console.log('useProducts hook initialized, fetching data...');
    fetchProducts();
    fetchServices();
    fetchTrendingProducts();
  }, []);

  // Set up periodic refresh for trending products (every 5 minutes)
  useEffect(() => {
    const trendingInterval = setInterval(() => {
      console.log('Refreshing trending products...');
      fetchTrendingProducts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(trendingInterval);
    };
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setIsLoadingNewArrivals(true);
    try {
      // Fetch featured products from the new API endpoint
      console.log('Fetching featured products from:', `${url}/featured`);
      const featuredResponse = await fetch(`${url}/featured`);
      console.log('Featured Products API Response Status:', featuredResponse.status);
      
      if (featuredResponse.ok) {
        const featuredProducts = await featuredResponse.json();
        console.log('Fetched featured products count:', featuredProducts.length);
        console.log('Sample featured product:', featuredProducts[0]);
        
        setFeaturedProducts(featuredProducts);
      } else {
        console.log('Featured products API failed, falling back to general products');
        // Fallback to general products if featured endpoint fails
        const response = await fetch(`${url}`);
        if (response.ok) {
          const products = await response.json();
          const nonServiceProducts = products.filter(product => product.isService !== true);
          setFeaturedProducts(nonServiceProducts);
        } else {
          console.log('Using mock data due to API failure');
          setFeaturedProducts(FEATURED_PRODUCTS);
        }
      }

      // Fetch new arrivals from the dedicated API endpoint
      console.log('Fetching new arrivals from:', `${url}/new`);
      const newArrivalsResponse = await fetch(`${url}/new`);
      console.log('New Arrivals API Response Status:', newArrivalsResponse.status);
      
      if (newArrivalsResponse.ok) {
        const newArrivalsData = await newArrivalsResponse.json();
        console.log('Fetched new arrivals count:', newArrivalsData.length);
        
        console.log('New arrivals (sorted by creation date):');
        newArrivalsData.slice(0, 3).forEach((product, index) => {
          console.log(`New arrival ${index + 1}: ${product.name} (created: ${product.createdAt})`);
        });
        
        setNewArrivals(newArrivalsData);
      } else {
        console.log('Failed to fetch new arrivals from dedicated endpoint, falling back to general products');
        // Fallback to general products if new arrivals endpoint fails
        const response = await fetch(`${url}`);
        if (response.ok) {
          const products = await response.json();
          const nonServiceProducts = products.filter(product => product.isService !== true);
          const shuffledProducts = [...nonServiceProducts].sort(() => Math.random() - 0.5);
          setNewArrivals(shuffledProducts);
        } else {
          setNewArrivals([]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      console.log('Using mock data due to error');
      setFeaturedProducts(FEATURED_PRODUCTS);
      setNewArrivals([]);
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
        
        // Implement rotating sorting strategies for services
        const sortStrategies = [
          // Strategy 1: Random shuffle
          () => [...serviceProducts].sort(() => Math.random() - 0.5),
          
          // Strategy 2: Sort by views (most viewed first)
          () => [...serviceProducts].sort((a, b) => (b.views || 0) - (a.views || 0)),
          
          // Strategy 3: Sort by rating (highest rating first)
          () => [...serviceProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
          
          // Strategy 4: Sort by price (lowest price first)
          () => [...serviceProducts].sort((a, b) => (a.price || 0) - (b.price || 0)),
          
          // Strategy 5: Sort by name (alphabetical)
          () => [...serviceProducts].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
          
          // Strategy 6: Sort by creation date (oldest first)
          () => [...serviceProducts].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)),
          
          // Strategy 7: Sort by featured rank (highest rank first)
          () => [...serviceProducts].sort((a, b) => (b.featuredRank || 0) - (a.featuredRank || 0)),
          
          // Strategy 8: Sort by discount percentage (highest discount first)
          () => [...serviceProducts].sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0))
        ];
        
        // Get current timestamp to determine which strategy to use
        const currentTime = Date.now();
        const strategyIndex = Math.floor((currentTime / (5 * 60 * 1000)) % sortStrategies.length); // Change every 5 minutes
        
        // Apply the selected sorting strategy
        const sortedServices = sortStrategies[strategyIndex]();
        
        console.log(`Applied sorting strategy ${strategyIndex + 1} for services`);
        setServices(sortedServices);
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

  const fetchTrendingProducts = async () => {
    setIsLoadingTrendingProducts(true);
    try {
      console.log('Fetching trending products from:', `${url}/trending`);
      const response = await fetch(`${url}/trending`);
      console.log('Trending Products API Response Status:', response.status);
      
      if (response.ok) {
        const trendingData = await response.json();
        console.log('Fetched trending products count:', trendingData.length);
        setTrendingProducts(trendingData);
      } else {
        console.log('Failed to fetch trending products');
        setTrendingProducts([]); // Set empty array if fetch fails
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setTrendingProducts([]); // Set empty array on error
    } finally {
      setTimeout(() => {
        setIsLoadingTrendingProducts(false);
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
      // Fetch featured products from the new API endpoint
      const featuredResponse = await fetch(`${url}/featured`);
      if (featuredResponse.ok) {
        const featuredProducts = await featuredResponse.json();
        setFeaturedProducts(featuredProducts);
      } else {
        // Fallback to general products if featured endpoint fails
        const response = await fetch(`${url}`);
        if (response.ok) {
          const products = await response.json();
          const nonServiceProducts = products.filter(product => product.isService !== true);
          setFeaturedProducts(nonServiceProducts);
        }
      }

      // Fetch new arrivals from the dedicated API endpoint
      const newArrivalsResponse = await fetch(`${url}/new`);
      if (newArrivalsResponse.ok) {
        const newArrivalsData = await newArrivalsResponse.json();
        setNewArrivals(newArrivalsData);
      } else {
        // Fallback to general products if new arrivals endpoint fails
        const response = await fetch(`${url}`);
        if (response.ok) {
          const products = await response.json();
          const nonServiceProducts = products.filter(product => product.isService !== true);
          const shuffledProducts = [...nonServiceProducts].sort(() => Math.random() - 0.5);
          setNewArrivals(shuffledProducts);
        }
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
    newArrivals,
    setNewArrivals,
    trendingProducts,
    setTrendingProducts,
    services,
    isLoadingProducts,
    setIsLoadingProducts,
    isLoadingServices,
    setIsLoadingServices,
    isLoadingNewArrivals,
    setIsLoadingNewArrivals,
    isLoadingTrendingProducts,
    setIsLoadingTrendingProducts,
    searchTimeoutRef,
    fetchProducts,
    fetchServices,
    fetchTrendingProducts,
    handleSearch,
    fetchOriginalProducts,
    fetchProductsByCategory,
  };
};