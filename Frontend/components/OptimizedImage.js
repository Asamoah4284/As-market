import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { 
  optimizeCloudinaryUrl, 
  optimizeBannerUrl, 
  optimizeProductUrl, 
  optimizeThumbnailUrl,
  preloadImage 
} from '../utils/imageUtils';

// Image cache to prevent re-rendering with the same images
const imageCache = new Map();

const OptimizedImage = memo(({
  source,
  style,
  resizeMode = 'cover',
  placeholderColor = '#f0f0f0',
  showLoadingIndicator = true,
  onLoad,
  onError,
  onLoadEnd,
  preload = false,
  imageType = 'product', // 'banner', 'product', 'thumbnail', 'custom'
  optimizationOptions = {}, // Custom options for 'custom' type
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  // Debounced image loading to prevent excessive re-renders
  const [loadingTimeout, setLoadingTimeout] = useState(null);

  const getOptimizationOptions = useCallback(() => {
    switch (imageType) {
      case 'banner':
        return {
          width: 1200,
          quality: '80',
          format: 'auto',
          maintainQuality: true
        };
      case 'thumbnail':
        return {
          width: 300,
          quality: '70',
          format: 'auto',
          maintainQuality: false
        };
      case 'custom':
        return optimizationOptions;
      case 'product':
      default:
        return {
          width: 600,
          quality: '75',
          format: 'auto',
          maintainQuality: false
        };
    }
  }, [imageType, optimizationOptions]);

  const getOptimizedUrl = useCallback((url) => {
    // Check cache first
    const cacheKey = `${url}-${imageType}`;
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }

    let optimizedUrl;
    switch (imageType) {
      case 'banner':
        optimizedUrl = optimizeBannerUrl(url);
        break;
      case 'thumbnail':
        optimizedUrl = optimizeThumbnailUrl(url);
        break;
      case 'custom':
        optimizedUrl = optimizeCloudinaryUrl(url, optimizationOptions);
        break;
      case 'product':
      default:
        optimizedUrl = optimizeProductUrl(url);
        break;
    }

    // Cache the optimized URL
    imageCache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }, [imageType, optimizationOptions]);

  useEffect(() => {
    let isMounted = true;

    const processImage = async () => {
      if (source?.uri) {
        const optimizedUri = getOptimizedUrl(source.uri);
        if (isMounted) {
          setImageUri(optimizedUri);
        }
        
        // Preload image if requested
        if (preload) {
          try {
            await preloadImage(source.uri, getOptimizationOptions());
          } catch (error) {
            console.warn('Preload failed:', error);
          }
        }
      } else if (typeof source === 'string') {
        const optimizedUri = getOptimizedUrl(source);
        if (isMounted) {
          setImageUri(optimizedUri);
        }
        
        // Preload image if requested
        if (preload) {
          try {
            await preloadImage(source, getOptimizationOptions());
          } catch (error) {
            console.warn('Preload failed:', error);
          }
        }
      }
    };

    processImage();

    return () => {
      isMounted = false;
    };
  }, [source, preload, getOptimizedUrl, getOptimizationOptions]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoad = useCallback((event) => {
    // Debounce loading state to prevent flicker
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setHasError(false);
    }, 100);
    
    setLoadingTimeout(timeout);
    onLoad?.(event);
  }, [onLoad, loadingTimeout]);

  const handleError = useCallback((event) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(event);
  }, [onError]);

  const handleLoadEnd = useCallback((event) => {
    setIsLoading(false);
    onLoadEnd?.(event);
  }, [onLoadEnd]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  if (!imageUri) {
    return (
      <View 
        style={[
          style, 
          { backgroundColor: placeholderColor },
          styles.placeholder
        ]} 
      />
    );
  }

  return (
    <View style={[style, styles.container]}>
      <Image
        source={{ uri: imageUri }}
        style={[style, styles.image]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        {...props}
      />
      
      {/* Loading indicator */}
      {isLoading && showLoadingIndicator && (
        <View style={[styles.overlay, styles.loadingOverlay]}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      
      {/* Error placeholder */}
      {hasError && (
        <View style={[styles.overlay, styles.errorOverlay]}>
          <View style={[style, { backgroundColor: placeholderColor }]} />
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.source === nextProps.source &&
    prevProps.imageType === nextProps.imageType &&
    prevProps.style === nextProps.style &&
    prevProps.resizeMode === nextProps.resizeMode &&
    prevProps.placeholderColor === nextProps.placeholderColor &&
    prevProps.showLoadingIndicator === nextProps.showLoadingIndicator &&
    prevProps.preload === nextProps.preload
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorOverlay: {
    backgroundColor: 'transparent',
  },
});

export default OptimizedImage; 