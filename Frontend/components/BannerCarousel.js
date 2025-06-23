import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import OptimizedImage from './OptimizedImage';

const BannerCarousel = memo(({ 
  banners, 
  isLoading, 
  navigation,
  BannerSkeleton 
}) => {
  const bannersScrollViewRef = useRef(null);

  // Auto-scroll banners
  useEffect(() => {
    let interval;
    if (banners.length > 1) {
      interval = setInterval(() => {
        if (bannersScrollViewRef.current) {
          const slideWidth = 280 + 15;
          const currentOffset = bannersScrollViewRef.current.contentOffset?.x || 0;
          const nextIndex = Math.floor(currentOffset / slideWidth) + 1;
          const nextOffset = (nextIndex % banners.length) * slideWidth;
          
          bannersScrollViewRef.current.scrollTo({
            x: nextOffset,
            animated: true,
          });
        }
      }, 3000);
    }
    return () => interval && clearInterval(interval);
  }, [banners.length]);

  if (isLoading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
      >
        {[1, 2].map((_, index) => (
          <BannerSkeleton key={index} />
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={bannersScrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled
    >
      {banners.map((banner) => (
        <TouchableOpacity
          key={banner._id}
          style={styles.specialOfferCard}
          onPress={() => {
            if (banner.linkType === 'seller') {
              navigation.navigate('CategoriesScreen', { sellerId: banner.linkId });
            } else if (banner.linkType === 'product') {
              navigation.navigate('ProductDetails', { productId: banner.linkId });
            }
          }}
        >
          <OptimizedImage 
            source={banner.image} 
            style={styles.offerBackgroundImage}
            resizeMode="cover"
            placeholderColor="#f0f0f0"
            showLoadingIndicator={true}
            preload={true}
            imageType="banner"
          />
          <View style={styles.offerContentWrapper}>
            <View style={styles.offerContent}>
              <Text style={styles.offerHeading}>{banner.title}</Text>
              <Text style={styles.offerDetails}>{banner.description}</Text>
              {banner.buttonText ? (
                <TouchableOpacity style={styles.offerButton}>
                  <Text style={styles.offerButtonText}>{banner.buttonText}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
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
});

export default BannerCarousel; 