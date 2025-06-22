import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export const useUser = () => {
  const [userName, setUserName] = useState('User');
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          console.log('Token found:', token.substring(0, 10) + '...');
          
          const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('User data response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('User data received:', userData);
            setUserName(userData.username || userData.name || userData.firstName || 'User');
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch user data. Status:', response.status, 'Error:', errorText);
            setUserName('User');
          }
        } else {
          console.log('No user token found');
          setUserName('Guest');
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        setUserName('User');
      }
    };

    getUserData();
  }, []);

  // Check if user is a seller
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userRole = await AsyncStorage.getItem('userRole');
        setIsSeller(userRole === 'seller');
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    checkUserRole();
  }, []);

  const reloadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const userResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserName(userData.username || userData.name || userData.firstName || 'User');
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }

    try {
      const userRole = await AsyncStorage.getItem('userRole');
      setIsSeller(userRole === 'seller');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  return {
    userName,
    isSeller,
    reloadUserData,
  };
}; 