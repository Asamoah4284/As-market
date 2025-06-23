import { Image } from 'react-native';

/**
 * Optimizes Cloudinary URLs by adding transformation parameters
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Target width (default: 600)
 * @param {string} options.quality - Quality setting (default: 'auto')
 * @param {string} options.format - Format setting (default: 'auto')
 * @param {boolean} options.maintainQuality - Whether to maintain high quality (default: false)
 * @returns {string} - The optimized Cloudinary URL with transformations
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Check if it's a Cloudinary URL
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width = 600,
    quality = 'auto',
    format = 'auto',
    maintainQuality = false
  } = options;

  // For high-quality images like banners, use different settings
  const finalQuality = maintainQuality ? 'q_80' : `q_${quality}`;
  const finalWidth = maintainQuality ? 'w_1200' : `w_${width}`;
  const finalFormat = maintainQuality ? 'f_auto' : `f_${format}`;

  // Check if transformations are already applied
  const transformationString = `${finalWidth},${finalQuality},${finalFormat}`;
  if (url.includes(transformationString)) {
    return url;
  }

  // Insert transformations after /upload/ and before the version
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    return url;
  }

  const beforeUpload = url.substring(0, uploadIndex + 8); // Include '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);

  // Check if there's a version parameter
  const versionMatch = afterUpload.match(/^v\d+\//);
  if (versionMatch) {
    const version = versionMatch[0];
    const rest = afterUpload.substring(version.length);
    return `${beforeUpload}${transformationString}/${version}${rest}`;
  } else {
    return `${beforeUpload}${transformationString}/${afterUpload}`;
  }
};

/**
 * Optimizes banner images with higher quality settings
 * @param {string} url - The original Cloudinary URL
 * @returns {string} - The optimized Cloudinary URL for banners
 */
export const optimizeBannerUrl = (url) => {
  return optimizeCloudinaryUrl(url, {
    width: 1200,
    quality: '80',
    format: 'auto',
    maintainQuality: true
  });
};

/**
 * Optimizes product images with standard settings
 * @param {string} url - The original Cloudinary URL
 * @returns {string} - The optimized Cloudinary URL for products
 */
export const optimizeProductUrl = (url) => {
  return optimizeCloudinaryUrl(url, {
    width: 600,
    quality: 'auto',
    format: 'auto',
    maintainQuality: false
  });
};

/**
 * Optimizes thumbnail images with smaller size
 * @param {string} url - The original Cloudinary URL
 * @returns {string} - The optimized Cloudinary URL for thumbnails
 */
export const optimizeThumbnailUrl = (url) => {
  return optimizeCloudinaryUrl(url, {
    width: 300,
    quality: 'auto',
    format: 'auto',
    maintainQuality: false
  });
};

/**
 * Preloads an image using Image.prefetch()
 * @param {string} url - The image URL to preload
 * @param {Object} options - Optimization options
 * @returns {Promise} - Promise that resolves when image is preloaded
 */
export const preloadImage = async (url, options = {}) => {
  if (!url) return;
  
  try {
    const optimizedUrl = optimizeCloudinaryUrl(url, options);
    await Image.prefetch(optimizedUrl);
    console.log('Image preloaded successfully:', optimizedUrl);
  } catch (error) {
    console.warn('Failed to preload image:', url, error);
  }
};

/**
 * Preloads multiple images
 * @param {string[]} urls - Array of image URLs to preload
 * @param {Object} options - Optimization options
 * @returns {Promise} - Promise that resolves when all images are preloaded
 */
export const preloadImages = async (urls, options = {}) => {
  if (!urls || !Array.isArray(urls)) return;
  
  const preloadPromises = urls.map(url => preloadImage(url, options));
  await Promise.allSettled(preloadPromises);
}; 