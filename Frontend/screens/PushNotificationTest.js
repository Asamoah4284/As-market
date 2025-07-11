import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PushNotificationTest() {
  const [pushToken, setPushToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem('pushToken');
      setPushToken(token || 'No token found');
      setLoading(false);
    };
    getToken();
  }, []);

  const sendTestNotification = async () => {
    if (!pushToken || pushToken === 'No token found') {
      Alert.alert('No push token', 'No push token found. Please ensure notifications are enabled.');
      return;
    }
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: 'Test Notification',
        body: 'This is a live test from your app!',
        data: { test: true },
      };
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      const data = await response.json();
      if (data.data && data.data.status === 'ok') {
        Alert.alert('Success', 'Test notification sent!');
      } else {
        Alert.alert('Error', JSON.stringify(data));
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Expo Push Token</Text>
      <Text selectable style={styles.token}>{loading ? 'Loading...' : pushToken}</Text>
      <Button title="Send Test Notification" onPress={sendTestNotification} disabled={loading || !pushToken || pushToken === 'No token found'} />
      <Text style={styles.info}>You must run this in a standalone build (not Expo Go) for push notifications to work.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  token: { fontSize: 14, marginBottom: 24, color: '#333', wordBreak: 'break-all' },
  info: { marginTop: 32, color: '#888', fontSize: 12, textAlign: 'center' },
}); 