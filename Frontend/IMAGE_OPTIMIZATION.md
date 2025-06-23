# Image Optimization Guide

This guide explains how to use the optimized image components and utilities in the React Native marketplace app.

## Overview

The image optimization system includes:
- **Cloudinary URL transformation** with automatic resizing, compression, and format optimization
- **OptimizedImage component** with loading states and error handling
- **Image preloading utilities** for better performance
- **Custom hooks** for managing image preloading
- **Image type-specific optimization** for different use cases

## Image Types and Quality Settings

The system supports different image types with appropriate quality settings:

### Banner Images (`imageType="banner"`)
- **Width**: 1200px
- **Quality**: 80% (high quality)
- **Format**: Auto (WebP/AVIF when supported)
- **Use case**: Marketing banners, hero images, main product images

### Product Images (`imageType="product"`)
- **Width**: 600px
- **Quality**: Auto (Cloudinary optimized)
- **Format**: Auto (WebP/AVIF when supported)
- **Use case**: Product thumbnails, list items

### Thumbnail Images (`imageType="thumbnail"`)
- **Width**: 300px
- **Quality**: Auto (Cloudinary optimized)
- **Format**: Auto (WebP/AVIF when supported)
- **Use case**: Small previews, avatars, icons

### Custom Images (`imageType="custom"`)
- **Fully customizable** optimization options
- **Use case**: Special requirements, specific dimensions

## Components

### OptimizedImage Component

A drop-in replacement for React Native's `Image` component with built-in optimization features.

```jsx
import OptimizedImage from '../components/OptimizedImage';

// Banner images (high quality)
<OptimizedImage
  source={banner.image}
  style={styles.bannerImage}
  imageType="banner"
  resizeMode="cover"
  preload={true}
/>

// Product images (standard quality)
<OptimizedImage
  source={product.image}
  style={styles.productImage}
  imageType="product"
  resizeMode="cover"
  placeholderColor="#f0f0f0"
  showLoadingIndicator={true}
/>

// Thumbnail images (smaller size)
<OptimizedImage
  source={user.avatar}
  style={styles.avatar}
  imageType="thumbnail"
  resizeMode="cover"
/>

// Custom optimization
<OptimizedImage
  source={specialImage}
  style={styles.specialImage}
  imageType="custom"
  optimizationOptions={{
    width: 800,
    quality: '90',
    format: 'auto',
    maintainQuality: true
  }}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `string` or `{uri: string}` | - | Image URL (Cloudinary URLs are automatically optimized) |
| `style` | `StyleSheet` | - | Image styles |
| `resizeMode` | `string` | `'cover'` | Image resize mode |
| `placeholderColor` | `string` | `'#f0f0f0'` | Background color while loading |
| `showLoadingIndicator` | `boolean` | `true` | Show loading spinner |
| `onLoad` | `function` | - | Called when image loads successfully |
| `onError` | `function` | - | Called when image fails to load |
| `onLoadEnd` | `function` | - | Called when image loading ends |
| `preload` | `boolean` | `false` | Preload image using Image.prefetch() |
| `imageType` | `string` | `'product'` | Image type: 'banner', 'product', 'thumbnail', 'custom' |
| `optimizationOptions` | `Object` | `{}` | Custom optimization options for 'custom' type |

## Utilities

### Image Utils (`utils/imageUtils.js`)

#### `optimizeCloudinaryUrl(url, options)`

Automatically transforms Cloudinary URLs to include optimization parameters:

```javascript
import { optimizeCloudinaryUrl } from '../utils/imageUtils';

// Banner quality
const bannerUrl = optimizeCloudinaryUrl(imageUrl, {
  width: 1200,
  quality: '80',
  format: 'auto',
  maintainQuality: true
});

// Product quality
const productUrl = optimizeCloudinaryUrl(imageUrl, {
  width: 600,
  quality: 'auto',
  format: 'auto',
  maintainQuality: false
});
```

#### `optimizeBannerUrl(url)`

Optimizes banner images with high quality settings:

```javascript
import { optimizeBannerUrl } from '../utils/imageUtils';

// Before: https://res.cloudinary.com/your-cloud/image/upload/v123/banner.jpg
// After:  https://res.cloudinary.com/your-cloud/image/upload/w_1200,q_80,f_auto/v123/banner.jpg

const optimizedBannerUrl = optimizeBannerUrl(bannerUrl);
```

#### `optimizeProductUrl(url)`

Optimizes product images with standard settings:

```javascript
import { optimizeProductUrl } from '../utils/imageUtils';

// Before: https://res.cloudinary.com/your-cloud/image/upload/v123/product.jpg
// After:  https://res.cloudinary.com/your-cloud/image/upload/w_600,q_auto,f_auto/v123/product.jpg

const optimizedProductUrl = optimizeProductUrl(productUrl);
```

#### `optimizeThumbnailUrl(url)`

Optimizes thumbnail images with smaller size:

```javascript
import { optimizeThumbnailUrl } from '../utils/imageUtils';

// Before: https://res.cloudinary.com/your-cloud/image/upload/v123/thumbnail.jpg
// After:  https://res.cloudinary.com/your-cloud/image/upload/w_300,q_auto,f_auto/v123/thumbnail.jpg

const optimizedThumbnailUrl = optimizeThumbnailUrl(thumbnailUrl);
```

#### `preloadImage(url, options)`

Preloads a single image with specific optimization:

```javascript
import { preloadImage } from '../utils/imageUtils';

// Preload banner with high quality
await preloadImage(bannerUrl, {
  width: 1200,
  quality: '80',
  format: 'auto',
  maintainQuality: true
});
```

#### `preloadImages(urls, options)`

Preloads multiple images with specific optimization:

```javascript
import { preloadImages } from '../utils/imageUtils';

const imageUrls = [
  'https://res.cloudinary.com/your-cloud/image/upload/v123/image1.jpg',
  'https://res.cloudinary.com/your-cloud/image/upload/v123/image2.jpg'
];

// Preload with banner quality
await preloadImages(imageUrls, {
  width: 1200,
  quality: '80',
  format: 'auto',
  maintainQuality: true
});
```

## Hooks

### useImagePreloader Hook

Custom hook for managing image preloading with priority levels and optimization options:

```jsx
import { useImagePreloader } from '../hooks/useImagePreloader';

const ProductDetailsScreen = () => {
  const productImages = [
    product.mainImage,
    ...product.additionalImages
  ].filter(Boolean);

  // Preload with high priority and banner quality
  useImagePreloader(productImages, true, 5, {
    width: 1200,
    quality: '80',
    format: 'auto',
    maintainQuality: true
  });

  return (
    // Your component JSX
  );
};
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `imageUrls` | `string[]` | `[]` | Array of image URLs to preload |
| `enabled` | `boolean` | `true` | Whether preloading is enabled |
| `priority` | `number` | `1` | Priority level (1-5, higher = more important) |
| `optimizationOptions` | `Object` | `{}` | Optimization options for the images |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isPreloaded` | `function(url)` | Check if specific URL is preloaded |
| `clearCache` | `function()` | Clear preloaded cache |

## Migration Guide

### Replacing Image Components

**Before:**
```jsx
import { Image } from 'react-native';

<Image
  source={{ uri: product.image }}
  style={styles.productImage}
  resizeMode="cover"
/>
```

**After:**
```jsx
import OptimizedImage from '../components/OptimizedImage';

// For banners and main product images
<OptimizedImage
  source={banner.image}
  style={styles.bannerImage}
  imageType="banner"
  resizeMode="cover"
  showLoadingIndicator={true}
/>

// For product thumbnails
<OptimizedImage
  source={product.image}
  style={styles.productImage}
  imageType="product"
  resizeMode="cover"
  showLoadingIndicator={false}
/>
```

### Adding Image Preloading

**For Product Details (High Quality):**
```jsx
const ProductDetailsScreen = () => {
  const productImages = [
    currentProduct?.image,
    ...(currentProduct?.additionalImages || [])
  ].filter(Boolean);

  // High priority preloading with banner quality
  useImagePreloader(productImages, true, 5, {
    width: 1200,
    quality: '80',
    format: 'auto',
    maintainQuality: true
  });

  return (
    // Your component
  );
};
```

**For Product Lists (Standard Quality):**
```jsx
const ProductListScreen = () => {
  const productImages = products.map(p => p.image).filter(Boolean);

  // Medium priority preloading with product quality
  useImagePreloader(productImages, true, 3, {
    width: 600,
    quality: 'auto',
    format: 'auto',
    maintainQuality: false
  });

  return (
    // Your component
  );
};
```

## Best Practices

### 1. Choose Appropriate Image Types

- **Banner**: Use for marketing banners, hero images, main product displays
- **Product**: Use for product thumbnails, list items, cart items
- **Thumbnail**: Use for small previews, avatars, icons
- **Custom**: Use for special requirements

### 2. Use Appropriate Quality Settings

```jsx
// High quality for important images
<OptimizedImage
  source={banner.image}
  imageType="banner"
  showLoadingIndicator={true}
  preload={true}
/>

// Standard quality for list items
<OptimizedImage
  source={product.image}
  imageType="product"
  showLoadingIndicator={false}
/>
```

### 3. Optimize Loading States

```jsx
// For product cards - no loading indicator
<OptimizedImage
  source={product.image}
  style={styles.productImage}
  imageType="product"
  showLoadingIndicator={false}
  placeholderColor="#f0f0f0"
/>

// For banners - show loading indicator
<OptimizedImage
  source={banner.image}
  style={styles.bannerImage}
  imageType="banner"
  showLoadingIndicator={true}
  preload={true}
/>
```

### 4. Handle Errors Gracefully

```jsx
<OptimizedImage
  source={product.image}
  style={styles.productImage}
  imageType="product"
  onError={(error) => {
    console.warn('Failed to load image:', error);
    // Optionally show fallback image or retry
  }}
/>
```

### 5. Preload Strategically

```jsx
// Preload images for next screen with appropriate quality
useEffect(() => {
  if (nextScreenImages.length > 0) {
    preloadImages(nextScreenImages, {
      width: 1200,
      quality: '80',
      format: 'auto',
      maintainQuality: true
    });
  }
}, [nextScreenImages]);
```

## Performance Benefits

1. **Optimized Quality**: Banner images maintain high quality (80%) while product images use auto-optimization
2. **Reduced Bandwidth**: Appropriate sizing for different use cases
3. **Faster Loading**: Optimized formats (WebP, AVIF) load faster
4. **Better UX**: Loading states and placeholders improve perceived performance
5. **Preloading**: Images are ready when needed, reducing loading delays
6. **Error Handling**: Graceful fallbacks when images fail to load

## Cloudinary URL Examples

**Banner Quality:**
```
Original: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/banner.jpg
Optimized: https://res.cloudinary.com/your-cloud/image/upload/w_1200,q_80,f_auto/v1234567890/banner.jpg
```

**Product Quality:**
```
Original: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/product.jpg
Optimized: https://res.cloudinary.com/your-cloud/image/upload/w_600,q_auto,f_auto/v1234567890/product.jpg
```

**Thumbnail Quality:**
```
Original: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/thumbnail.jpg
Optimized: https://res.cloudinary.com/your-cloud/image/upload/w_300,q_auto,f_auto/v1234567890/thumbnail.jpg
```

## Troubleshooting

### Images Not Loading
1. Check if the URL is valid
2. Verify Cloudinary configuration
3. Check network connectivity
4. Review error logs in console

### Banner Images Not Clear Enough
1. Ensure `imageType="banner"` is set
2. Check that quality is set to 80%
3. Verify width is 1200px
4. Consider using `maintainQuality: true`

### Preloading Not Working
1. Ensure `enabled` parameter is `true`
2. Check if URLs are valid
3. Verify priority levels are set correctly
4. Check console for preloading errors

### Performance Issues
1. Reduce preloading priority for less important images
2. Limit number of images preloaded simultaneously
3. Use appropriate placeholder colors
4. Consider lazy loading for long lists 