// Performance monitoring utilities for React Native
import { InteractionManager } from 'react-native';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      scrollEvents: 0,
      renders: 0,
      startTime: Date.now(),
    };
  }

  trackScrollEvent() {
    this.metrics.scrollEvents++;
  }

  trackRender() {
    this.metrics.renders++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      duration: Date.now() - this.metrics.startTime,
      scrollsPerSecond: this.metrics.scrollEvents / ((Date.now() - this.metrics.startTime) / 1000),
      rendersPerSecond: this.metrics.renders / ((Date.now() - this.metrics.startTime) / 1000),
    };
  }

  reset() {
    this.metrics = {
      scrollEvents: 0,
      renders: 0,
      startTime: Date.now(),
    };
  }
}

// Debounce function for performance optimization
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Optimize heavy operations with InteractionManager
export const optimizeHeavyOperation = (operation) => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve(operation());
    });
  });
};

// Memory optimization - clear unused cache
export const clearImageCache = () => {
  // This would integrate with your image cache
  console.log('Clearing image cache for memory optimization');
};

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// FlatList optimization props
export const getOptimizedFlatListProps = (itemSize = 200) => ({
  removeClippedSubviews: true,
  maxToRenderPerBatch: 5,
  windowSize: 10,
  initialNumToRender: 10,
  updateCellsBatchingPeriod: 100,
  scrollEventThrottle: 16,
  bounces: false,
  getItemLayout: (data, index) => ({
    length: itemSize,
    offset: itemSize * index,
    index,
  }),
});

// Image optimization presets
export const imageOptimizationPresets = {
  thumbnail: {
    width: 150,
    height: 150,
    quality: 70,
    format: 'webp',
  },
  card: {
    width: 300,
    height: 200,
    quality: 75,
    format: 'webp',
  },
  banner: {
    width: 800,
    height: 400,
    quality: 80,
    format: 'webp',
  },
  fullscreen: {
    width: 1200,
    height: 800,
    quality: 85,
    format: 'webp',
  },
};

export default {
  performanceMonitor,
  debounce,
  throttle,
  optimizeHeavyOperation,
  clearImageCache,
  getOptimizedFlatListProps,
  imageOptimizationPresets,
};