import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireAuthentication } from '../utils/authUtils';

export const useFavorites = (navigation) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from AsyncStorage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
          console.log('Loaded favorites from storage:', JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  // Function to toggle favorite status
  const toggleFavorite = async (productId) => {
    // Check if user is authenticated
    if (!(await requireAuthentication(navigation, 'add to favorites'))) {
      return;
    }
    
    try {
      let newFavorites;
      if (favorites.includes(productId)) {
        // Remove from favorites
        newFavorites = favorites.filter(id => id !== productId);
      } else {
        // Add to favorites
        newFavorites = [...favorites, productId];
      }

      // Update state
      setFavorites(newFavorites);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      console.log('Favorites updated:', newFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const reloadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  return {
    favorites,
    toggleFavorite,
    reloadFavorites,
  };
}; 