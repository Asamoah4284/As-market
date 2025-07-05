import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import OptimizedImage from './OptimizedImage';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = 280;
const BANNER_SPACING = 15;
const BANNER_TOTAL_WIDTH = BANNER_WIDTH + BANNER_SPACING;

// Create AnimatedFlatList for native scroll events
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const BannerCarousel = memo(({ 
  banners, 
  isLoading, 
  navigation,
  BannerSkeleton 
}) => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);

  // Memoized viewability config for better performance
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // Memoized getItemLayout for FlatList optimization
  const getItemLayout = useCallback((data, index) => ({
    length: BANNER_TOTAL_WIDTH,
    offset: BANNER_TOTAL_WIDTH * index,
    index,
  }), []);

  // Optimized auto-scroll with scrollToOffset for better performance
  useEffect(() => {
    if (banners.length > 1 && !isUserScrolling) {
      autoScrollIntervalRef.current = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (currentIndex + 1) % banners.length;
          const offset = nextIndex * BANNER_TOTAL_WIDTH;
          
          flatListRef.current.scrollToOffset({
            offset,
            animated: true,
          });
        }
      }, 4000);
    }
    
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [currentIndex, banners.length, isUserScrolling]);

  // Handle user scroll interaction with debouncing
  const handleUserScroll = useCallback(() => {
    setIsUserScrolling(true);
    
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2500);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  // Optimized scroll handler with native driver
  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { 
        useNativeDriver: true,
        listener: handleUserScroll,
      }
    ),
    [handleUserScroll]
  );

  // Optimized viewable items callback
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const renderBanner = useCallback(({ item, index }) => {
    // Safety check for required properties
    if (!item || !item.image) {
      return null;
    }

    const handlePress = () => {
      if (item.linkType === 'seller') {
        navigation.navigate('CategoriesScreen', { sellerId: item.linkId });
      } else if (item.linkType === 'product') {
        navigation.navigate('ProductDetails', { productId: item.linkId });
      }
    };

    return (
      <TouchableOpacity
        style={styles.specialOfferCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <OptimizedImage 
          source={item.image} 
          style={styles.offerBackgroundImage}
          resizeMode="cover"
          placeholderColor="#f0f0f0"
          showLoadingIndicator={false}
          preload={true}
          imageType="banner"
        />
        <View style={styles.offerContentWrapper}>
          <View style={styles.offerContent}>
            <Text style={styles.offerHeading} numberOfLines={2}>
              {item.title || 'Special Offer'}
            </Text>
            <Text style={styles.offerDetails} numberOfLines={2}>
              {item.description || 'Discover amazing deals'}
            </Text>
            {item.buttonText ? (
              <TouchableOpacity style={styles.offerButton} activeOpacity={0.7}>
                <Text style={styles.offerButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  // Memoized pagination dots data to prevent unnecessary re-renders
  const paginationDotsData = useMemo(() => 
    banners.map((_, index) => ({ index, key: `dot-${index}` }))
  , [banners.length]);

  // Memoized keyExtractor for banner items
  const keyExtractor = useCallback((item, index) => {
    return item._id || item.id || index.toString();
  }, []);

  // Optimized pagination dots with memoized data
  const renderPaginationDots = useCallback(() => {
    if (banners.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {paginationDotsData.map(({ index }) => {
          const inputRange = [
            (index - 1) * BANNER_TOTAL_WIDTH,
            index * BANNER_TOTAL_WIDTH,
            (index + 1) * BANNER_TOTAL_WIDTH,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  }, [paginationDotsData, scrollX]);

  if (isLoading) {
    return (
      <View>
        <FlatList
          data={[1, 2]}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.skeletonContainer}>
              <BannerSkeleton key={index} />
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.flatListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={2}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
        />
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={banners}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderBanner}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.flatListContent}
        onScroll={handleScroll}
        onScrollBeginDrag={handleUserScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={BANNER_TOTAL_WIDTH}
        decelerationRate={0.8}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={2}
        updateCellsBatchingPeriod={50}
        bounces={false}
        scrollEventThrottle={16}
      />
      {renderPaginationDots()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  flatListContent: {
    // Removed paddingHorizontal since parent container has it
  },
  skeletonContainer: {
    marginRight: 15,
  },
  specialOfferCard: {
    width: BANNER_WIDTH,
    height: 160,
    borderRadius: 15,
    marginRight: BANNER_SPACING,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0', // Fallback color
    // Performance optimizations
    backfaceVisibility: 'hidden',
  },
  offerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.85,
    // Performance optimizations
    backfaceVisibility: 'hidden',
  },
  offerContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    position: 'relative',
    zIndex: 1,
  },
  offerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  offerHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  offerDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  offerButton: {
    backgroundColor: '#f9004d',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    // Removed paddingHorizontal to align with parent container
  },
  paginationDot: {
    height: 8,
    width: 8,
    backgroundColor: '#5D3FD3',
    marginHorizontal: 4,
    borderRadius: 4,
  },
});

export default BannerCarousel; 