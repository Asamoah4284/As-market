// API Configuration
import Constants from 'expo-constants';

// Get the API URL from app.json or use a fallback
export const API_BASE_URL = Constants.expoConfig?.extra?.API_URL || 'https://unimarket-ikin.onrender.com';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/users/login`,
  REGISTER: `${API_BASE_URL}/api/users/register`,
  
  // Order endpoints
  CREATE_ORDER: `${API_BASE_URL}/api/orders`,
  GET_MY_ORDERS: `${API_BASE_URL}/api/orders/myorders`,
  GET_ORDER: (id) => `${API_BASE_URL}/api/orders/${id}`,
  
  // Product endpoints
  GET_PRODUCTS: `${API_BASE_URL}/api/products`,
  GET_PRODUCT: (id) => `${API_BASE_URL}/api/products/${id}`,
  
  // Cart endpoints
  GET_CART: `${API_BASE_URL}/api/cart`,
  UPDATE_CART: `${API_BASE_URL}/api/cart`,
};

export default {
  API_BASE_URL
}; 