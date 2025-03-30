import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SellerProfileScreen = ({ route, navigation }) => {
  const { sellerId } = route.params;
  const windowWidth = Dimensions.get('window').width;

  // Placeholder data - replace with actual API call
  const sellerData = {
    name: "John Doe",
    rating: 4.8,
    totalSales: 156,
    joinDate: "March 2023",
    avatar: "https://placeholder.com/150",
    description: "Passionate about creating handmade crafts and delivering quality products to my customers.",
    location: "New York, USA",
    responseRate: "98%",
    responseTime: "< 2 hours",
    badges: ["Top Seller", "Fast Shipper", "Trusted"],
    followers: 1234,
    productLikes: 2891,
    featuredProducts: [
      { id: 1, image: "https://placeholder.com/300", price: "$49.99" },
      { id: 2, image: "https://placeholder.com/300", price: "$29.99" },
      { id: 3, image: "https://placeholder.com/300", price: "$39.99" },
    ],
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Enhanced Header */}
        <LinearGradient
          colors={['#2193b0', '#6dd5ed']}
          style={styles.headerGradient}
        >
          <View style={styles.headerOverlay}>
            <Image
              source={{ uri: sellerData.avatar }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={24} color="#2193b0" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{sellerData.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={16} color="#666" />
            <Text style={styles.location}>{sellerData.location}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={20} color="#FFD700" />
            <Text style={styles.rating}>{sellerData.rating}</Text>
            <Text style={styles.ratingCount}>(124 reviews)</Text>
          </View>
        </View>

        {/* Enhanced Badges Section */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.badgesContainer}
        >
          {sellerData.badges.map((badge, index) => (
            <LinearGradient
              key={index}
              colors={['#2193b0', '#6dd5ed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <FontAwesome5 name="award" size={16} color="#fff" />
              <Text style={styles.badgeText}>{badge}</Text>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* Stats Cards with Animation */}
        <View style={styles.statsGrid}>
          <View style={[styles.statsCard, { width: windowWidth / 2 - 24 }]}>
            <Ionicons name="cart-outline" size={24} color="#4a90e2" />
            <Text style={styles.statNumber}>{sellerData.totalSales}</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </View>
          <View style={[styles.statsCard, { width: windowWidth / 2 - 24 }]}>
            <Ionicons name="people-outline" size={24} color="#4a90e2" />
            <Text style={styles.statNumber}>{sellerData.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        {/* Second Row of Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statsCard, { width: windowWidth / 2 - 24 }]}>
            <AntDesign name="heart" size={24} color="#4a90e2" />
            <Text style={styles.statNumber}>{sellerData.productLikes}</Text>
            <Text style={styles.statLabel}>Product Likes</Text>
          </View>
          <View style={[styles.statsCard, { width: windowWidth / 2 - 24 }]}>
            <Ionicons name="time-outline" size={24} color="#4a90e2" />
            <Text style={styles.statNumber}>{sellerData.responseRate}</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>

        {/* Featured Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.productsContainer}
          >
            {sellerData.featuredProducts.map((product, index) => (
              <TouchableOpacity key={index} style={styles.productCard}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <Text style={styles.productPrice}>{product.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Info Section */}
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoItem}>
            <Ionicons name="timer-outline" size={20} color="#666" />
            <Text style={styles.quickInfoText}>Responds in {sellerData.responseTime}</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.quickInfoText}>Member since {sellerData.joinDate}</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{sellerData.description}</Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Feather name="message-circle" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="arrowleft" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    alignItems: 'center',
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
    borderColor: '#fff',
    marginTop: 60,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -40,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  location: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 5,
  },
  ratingCount: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 5,
    opacity: 0.8,
  },
  badgesContainer: {
    flexDirection: 'row',
    padding: 15,
    marginTop: -20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  badgeText: {
    marginLeft: 5,
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quickInfoContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickInfoText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  productsContainer: {
    marginTop: 10,
  },
  productCard: {
    width: 150,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 15,
  },
  productPrice: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: 5,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2193b0',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SellerProfileScreen; 