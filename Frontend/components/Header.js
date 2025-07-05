import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationBadge from './NotificationBadge';

const Header = ({ 
  location, 
  refreshing, 
  isSeller, 
  onRefresh, 
  onNotificationPress, 
  onSellerDashboardPress,
  navigation 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandNameContainer}>
            <Text style={[styles.greeting, {color: '#fff'}]}>Asarion</Text>
            <Text style={[styles.greeting, {color: '#FF4757'}]}> Marketplace</Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text 
              style={styles.locationText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {location}
            </Text>
            {location === 'Loading location...' ? (
              <Ionicons name="sync" size={14} color="#fff" style={{marginLeft: 4, opacity: 0.8}} />
            ) : null}
            {refreshing && (
              <Ionicons name="refresh" size={14} color="#fff" style={{marginLeft: 4, opacity: 0.8}} />
            )}
          </View>
        </View>
        <View style={styles.headerIcons}>
          {isSeller && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={onSellerDashboardPress}
            >
              <MaterialIcons name="dashboard" size={24} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onNotificationPress}
          >
            <NotificationBadge />
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5D3FD3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 28 : 20,
    backgroundColor: '#5D3FD3',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  brandNameContainer: {
    flexDirection: 'row',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    marginRight: 4,
    
    opacity: 1,
    flex: 1,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header; 