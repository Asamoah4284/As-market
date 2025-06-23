import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load recently viewed from AsyncStorage
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const storedRecentlyViewed = await AsyncStorage.getItem('recentlyViewed');
        if (storedRecentlyViewed) {
          const parsed = JSON.parse(storedRecentlyViewed);
          setRecentlyViewed(parsed);
        }
      } catch (error) {
        console.error('Error loading recently viewed:', error);
      }
    };

    loadRecentlyViewed();
  }, []);

  // Add product to recently viewed
  const addToRecentlyViewed = async (product) => {
    try {
      const newRecentlyViewed = [
        product._id,
        ...recentlyViewed.filter(id => id !== product._id)
      ].slice(0, 20); // Keep only last 20 items

      setRecentlyViewed(newRecentlyViewed);
      await AsyncStorage.setItem('recentlyViewed', JSON.stringify(newRecentlyViewed));
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
  };

  // Fetch recently viewed products details
  const fetchRecentlyViewedProducts = async () => {
    if (recentlyViewed.length === 0) {
      setRecentlyViewedProducts([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.API_BASE_URL || 'https://unimarket-ikin.onrender.com'}/api/products`);
      
      if (response.ok) {
        const allProducts = await response.json();
        const recentlyViewedProductsData = allProducts.filter(product => 
          recentlyViewed.includes(product._id)
        );
        
        // Sort by recently viewed order
        const sortedProducts = recentlyViewedProductsData.sort((a, b) => {
          const aIndex = recentlyViewed.indexOf(a._id);
          const bIndex = recentlyViewed.indexOf(b._id);
          return aIndex - bIndex;
        });

        setRecentlyViewedProducts(sortedProducts);
      }
    } catch (error) {
      console.error('Error fetching recently viewed products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear recently viewed
  const clearRecentlyViewed = async () => {
    try {
      setRecentlyViewed([]);
      setRecentlyViewedProducts([]);
      await AsyncStorage.removeItem('recentlyViewed');
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  return {
    recentlyViewed,
    recentlyViewedProducts,
    loading,
    addToRecentlyViewed,
    fetchRecentlyViewedProducts,
    clearRecentlyViewed,
  };
}; 