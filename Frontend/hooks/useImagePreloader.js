import { useEffect, useRef } from 'react';
import { preloadImages } from '../utils/imageUtils';

/**
 * Custom hook for preloading images
 * @param {string[]} imageUrls - Array of image URLs to preload
 * @param {boolean} enabled - Whether preloading is enabled
 * @param {number} priority - Priority level (higher = more important)
 * @param {Object} optimizationOptions - Optimization options for the images
 */
export const useImagePreloader = (imageUrls = [], enabled = true, priority = 1, optimizationOptions = {}) => {
  const preloadedRef = useRef(new Set());
  const isPreloadingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !imageUrls.length || isPreloadingRef.current) {
      return;
    }

    const preloadImagesAsync = async () => {
      isPreloadingRef.current = true;
      
      try {
        // Filter out already preloaded images
        const newImages = imageUrls.filter(url => !preloadedRef.current.has(url));
        
        if (newImages.length > 0) {
          console.log(`Preloading ${newImages.length} images with priority ${priority}`);
          
          // Use setTimeout to defer preloading based on priority
          setTimeout(async () => {
            await preloadImages(newImages, optimizationOptions);
            
            // Mark images as preloaded
            newImages.forEach(url => preloadedRef.current.add(url));
            
            console.log(`Successfully preloaded ${newImages.length} images`);
          }, (5 - priority) * 100); // Higher priority = shorter delay
        }
      } catch (error) {
        console.warn('Error preloading images:', error);
      } finally {
        isPreloadingRef.current = false;
      }
    };

    preloadImagesAsync();
  }, [imageUrls, enabled, priority, optimizationOptions]);

  return {
    isPreloaded: (url) => preloadedRef.current.has(url),
    clearCache: () => {
      preloadedRef.current.clear();
    }
  };
}; 