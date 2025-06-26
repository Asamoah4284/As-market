import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Dimensions,
  Animated 
} from 'react-native';
import OptimizedImage from './OptimizedImage';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = 280;
const BANNER_SPACING = 15;
const BANNER_TOTAL_WIDTH = BANNER_WIDTH + BANNER_SPACING;

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

  // Auto-scroll banners
  useEffect(() => {
    let interval;
    if (banners.length > 1 && !isUserScrolling) {
      interval = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (currentIndex + 1) % banners.length;
          try {
            flatListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch (error) {
            // Fallback to scrollTo if scrollToIndex fails
            const offset = nextIndex * BANNER_TOTAL_WIDTH;
            flatListRef.current.scrollTo({
              x: offset,
              animated: true,
            });
          }
        }
      }, 3000);
    }
    return () => interval && clearInterval(interval);
  }, [currentIndex, banners.length, isUserScrolling]);

  // Handle user scroll interaction
  const handleUserScroll = () => {
    setIsUserScrolling(true);
    
    // Clear existing timeout
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    
    // Resume auto-scroll after 5 seconds of no user interaction
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 5000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Stable viewabilityConfig using useRef to prevent any changes on re-renders
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
  });

  // Stable callback for onViewableItemsChanged using useCallback to prevent re-creation
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const renderBanner = ({ item, index }) => {
    // Safety check for required properties
    if (!item || !item.image) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.specialOfferCard}
        onPress={() => {
          if (item.linkType === 'seller') {
            navigation.navigate('CategoriesScreen', { sellerId: item.linkId });
          } else if (item.linkType === 'product') {
            navigation.navigate('ProductDetails', { productId: item.linkId });
          }
        }}
      >
        <OptimizedImage 
          source={item.image} 
          style={styles.offerBackgroundImage}
          resizeMode="cover"
          placeholderColor="#f0f0f0"
          showLoadingIndicator={true}
          preload={true}
          imageType="banner"
        />
        <View style={styles.offerContentWrapper}>
          <View style={styles.offerContent}>
            <Text style={styles.offerHeading}>{item.title || 'Special Offer'}</Text>
            <Text style={styles.offerDetails}>{item.description || 'Discover amazing deals'}</Text>
            {item.buttonText ? (
              <TouchableOpacity style={styles.offerButton}>
                <Text style={styles.offerButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaginationDots = () => {
    if (banners.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {banners.map((_, index) => {
          const inputRange = [
            (index - 1) * BANNER_TOTAL_WIDTH,
            index * BANNER_TOTAL_WIDTH,
            (index + 1) * BANNER_TOTAL_WIDTH,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

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
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfigRef.current}
        />
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderBanner}
        keyExtractor={(item, index) => item._id || `banner-${index}`}
        contentContainerStyle={styles.flatListContent}
        onScroll={handleScroll}
        onScrollBeginDrag={handleUserScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfigRef.current}
        snapToInterval={BANNER_TOTAL_WIDTH}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: BANNER_TOTAL_WIDTH,
          offset: BANNER_TOTAL_WIDTH * index,
          index,
        })}
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
 
  },
  offerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.85,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5D3FD3',
    marginHorizontal: 4,
  },
});

export default BannerCarousel; 