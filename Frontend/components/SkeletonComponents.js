import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const ProductSkeleton = ({ shimmerValue }) => {
  // Safety check for shimmerValue
  if (!shimmerValue) {
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          <View style={styles.skeletonImage} />
        </View>
        <View style={styles.productInfo}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonPrice} />
        </View>
      </View>
    );
  }

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  return (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <View style={styles.skeletonImage}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.productInfo}>
        <View style={styles.skeletonTitle}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        <View style={styles.skeletonPrice}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export const BannerSkeleton = ({ shimmerValue }) => {
  // Safety check for shimmerValue
  if (!shimmerValue) {
    return (
      <View style={styles.specialOfferCard}>
        <View style={styles.skeletonBanner} />
      </View>
    );
  }

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.specialOfferCard}>
      <View style={styles.skeletonBanner}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

export const CategorySkeleton = ({ shimmerValue }) => {
  // Safety check for shimmerValue
  if (!shimmerValue) {
    return (
      <View style={styles.categoryCard}>
        <View style={[styles.categoryIconContainer, { backgroundColor: '#E1E9EE' }]} />
        <View style={[styles.skeletonCategoryName, { backgroundColor: '#E1E9EE' }]} />
      </View>
    );
  }

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  return (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryIconContainer, { backgroundColor: '#E1E9EE' }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={[styles.skeletonCategoryName, { backgroundColor: '#E1E9EE' }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

export const ServiceSkeleton = ({ shimmerValue }) => {
  // Safety check for shimmerValue
  if (!shimmerValue) {
    return (
      <View style={styles.productCard}>
        <View style={styles.skeletonImage} />
        <View style={styles.productInfo}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonPrice} />
        </View>
      </View>
    );
  }

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  return (
    <View style={styles.productCard}>
      <View style={styles.skeletonImage}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={styles.productInfo}>
        <View style={styles.skeletonTitle}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        <View style={styles.skeletonPrice}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export const DealSkeleton = ({ shimmerValue }) => {
  // Safety check for shimmerValue
  if (!shimmerValue) {
    return (
      <View style={styles.dealCard}>
        <View style={styles.skeletonDealImage} />
        <View style={styles.dealInfo}>
          <View style={styles.skeletonDealTitle} />
          <View style={styles.skeletonDealDescription} />
        </View>
      </View>
    );
  }

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  return (
    <View style={styles.dealCard}>
      <View style={styles.skeletonDealImage}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={styles.dealInfo}>
        <View style={styles.skeletonDealTitle}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        <View style={styles.skeletonDealDescription}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export const BrandSkeleton = ({ shimmerValue }) => {
  // Safety check for shimmerValue
  if (!shimmerValue) {
    return (
      <View style={styles.brandCircle}>
        <View style={[styles.skeletonBrandLogo, { backgroundColor: '#E1E9EE' }]} />
        <View style={[styles.skeletonBrandName, { backgroundColor: '#E1E9EE' }]} />
      </View>
    );
  }

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  return (
    <View style={styles.brandCircle}>
      <View style={[styles.skeletonBrandLogo, { backgroundColor: '#E1E9EE' }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={[styles.skeletonBrandName, { backgroundColor: '#E1E9EE' }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: 180,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImageContainer: {
    position: 'relative',
    height: 100,
  },
  skeletonImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  productInfo: {
    padding: 12,
  },
  skeletonTitle: {
    width: '80%',
    height: 15,
    backgroundColor: '#E1E9EE',
    marginVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonPrice: {
    width: '40%',
    height: 15,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  specialOfferCard: {
    width: 280,
    height: 160,
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  skeletonBanner: {
    width: 280,
    height: 160,
    backgroundColor: '#E1E9EE',
    borderRadius: 15,
    overflow: 'hidden',
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 50,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonCategoryName: {
    width: 80,
    height: 15,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dealCard: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skeletonDealImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  dealInfo: {
    padding: 16,
  },
  skeletonDealTitle: {
    width: '80%',
    height: 15,
    backgroundColor: '#E1E9EE',
    marginVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonDealDescription: {
    width: '40%',
    height: 15,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  brandCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonBrandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  skeletonBrandName: {
    width: 80,
    height: 15,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F8F8',
    opacity: 0.5,
  },
}); 