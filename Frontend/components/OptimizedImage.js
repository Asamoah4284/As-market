import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { 
  optimizeCloudinaryUrl, 
  optimizeBannerUrl, 
  optimizeProductUrl, 
  optimizeThumbnailUrl,
  preloadImage 
} from '../utils/imageUtils';

const OptimizedImage = ({
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

  useEffect(() => {
    if (source?.uri) {
      const optimizedUri = getOptimizedUrl(source.uri);
      setImageUri(optimizedUri);
      
      // Preload image if requested
      if (preload) {
        preloadImage(source.uri, getOptimizationOptions());
      }
    } else if (typeof source === 'string') {
      const optimizedUri = getOptimizedUrl(source);
      setImageUri(optimizedUri);
      
      // Preload image if requested
      if (preload) {
        preloadImage(source, getOptimizationOptions());
      }
    }
  }, [source, preload, imageType, optimizationOptions]);

  const getOptimizationOptions = () => {
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
          quality: 'auto',
          format: 'auto',
          maintainQuality: false
        };
      case 'custom':
        return optimizationOptions;
      case 'product':
      default:
        return {
          width: 600,
          quality: 'auto',
          format: 'auto',
          maintainQuality: false
        };
    }
  };

  const getOptimizedUrl = (url) => {
    switch (imageType) {
      case 'banner':
        return optimizeBannerUrl(url);
      case 'thumbnail':
        return optimizeThumbnailUrl(url);
      case 'custom':
        return optimizeCloudinaryUrl(url, optimizationOptions);
      case 'product':
      default:
        return optimizeProductUrl(url);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoad = (event) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(event);
  };

  const handleError = (event) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(event);
  };

  const handleLoadEnd = (event) => {
    setIsLoading(false);
    onLoadEnd?.(event);
  };

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
};

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