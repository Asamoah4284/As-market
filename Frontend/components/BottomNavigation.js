import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNavigation = memo(({ 
  navigation, 
  cartItems, 
  favorites, 
  currentScreen = 'BuyerHome' 
}) => {
  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('BuyerHome')}
      >
        <Ionicons 
          name="home" 
          size={22} 
          color={currentScreen === 'BuyerHome' ? "#5D3FD3" : "#999"} 
        />
        <Text style={[
          styles.navText, 
          currentScreen === 'BuyerHome' && styles.activeNavText
        ]}>
          Home
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Categories')}
      >
        <Ionicons 
          name="grid-outline" 
          size={22} 
          color={currentScreen === 'Categories' ? "#5D3FD3" : "#999"} 
        />
        <Text style={[
          styles.navText, 
          currentScreen === 'Categories' && styles.activeNavText
        ]}>
          Categories
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.centerButton}
        onPress={() => navigation.navigate('Cart')}
      >
        <View style={styles.centerButtonInner}>
          <Ionicons name="cart" size={24} color="#fff" />
          {cartItems && cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Favorites')}
      >
        <Ionicons 
          name={favorites.length > 0 ? "heart" : "heart-outline"} 
          size={22} 
          color={favorites.length > 0 ? "#FF4757" : "#999"} 
        />
        <Text style={[
          styles.navText, 
          favorites.length > 0 && styles.activeNavText
        ]}>
          Favorites
        </Text>
        {favorites.length > 0 && (
          <View style={styles.favoriteBadge}>
            <Text style={styles.favoriteBadgeText}>{favorites.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons 
          name="person-outline" 
          size={22} 
          color={currentScreen === 'Profile' ? "#5D3FD3" : "#999"} 
        />
        <Text style={[
          styles.navText, 
          currentScreen === 'Profile' && styles.activeNavText
        ]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9e9e9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 999,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#999',
  },
  activeNavText: {
    color: '#5D3FD3',
    fontWeight: 'bold',
  },
  centerButton: {
    top: -30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 0,
    right: '25%',
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 1,
  },
  favoriteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
});

export default BottomNavigation; 