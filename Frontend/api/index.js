import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get the API URL from environment variables, with a fallback
const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://172.20.10.2:5000';

const api = axios.create({
  baseURL: API_URL,
  // baseURL: 'https://unimarket-ikin.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 