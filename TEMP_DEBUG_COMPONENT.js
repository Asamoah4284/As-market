// TEMPORARY DEBUG COMPONENT - Add this to your app to test push notifications
// You can add this as a button in your BuyerHomeScreen or any screen

import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const DebugPushNotifications = () => {
  const testPushNotifications = async () => {
    try {
      console.log('🔍 DEBUG: Testing push notifications...');
      console.log('🔍 DEBUG: Device.isDevice:', Device.isDevice);
      console.log('🔍 DEBUG: Constants.appOwnership:', Constants.appOwnership);
      console.log('🔍 DEBUG: Platform:', Platform.OS);
      console.log('🔍 DEBUG: App name:', Constants.expoConfig?.name);
      
      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('🔍 DEBUG: Current permission status:', status);
      
      if (status !== 'granted') {
        console.log('🔍 DEBUG: Requesting permissions...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('🔍 DEBUG: New permission status:', newStatus);
        
        if (newStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Push notifications require permission');
          return;
        }
      }
      
      // Try to get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      console.log('🔍 DEBUG: Project ID:', projectId);
      
      if (!projectId) {
        Alert.alert('Error', 'Project ID not found');
        return;
      }
      
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('🔍 DEBUG: Push token:', token.data);
      
      Alert.alert('Success!', `Push token: ${token.data.substring(0, 20)}...`);
      
    } catch (error) {
      console.error('🔍 DEBUG: Error testing push notifications:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="🔍 Test Push Notifications" onPress={testPushNotifications} />
    </View>
  );
};

// HOW TO USE:
// 1. Import this component in your BuyerHomeScreen
// 2. Add <DebugPushNotifications /> to your screen
// 3. Tap the button to test push notifications
// 4. Check the console logs and alert messages 