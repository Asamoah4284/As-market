import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const NotificationBadge = ({ style }) => {
  const { notifications } = useSelector((state) => state.notifications);
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  if (unreadCount === 0) {
    return null;
  }
  
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 10,
    elevation: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationBadge; 