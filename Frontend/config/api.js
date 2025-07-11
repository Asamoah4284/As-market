// API Configuration
import Constants from 'expo-constants';

// Get the API URL from app.json or use local development URL
export const API_BASE_URL = Constants.expoConfig?.extra?.API_URL || 'https://unimarket-ikin.onrender.com';

// Get Paystack public key from environment or use default
export const PAYSTACK_PUBLIC_KEY = Constants.expoConfig?.extra?.PAYSTACK_PUBLIC_KEY || 'pk_live_544b2e05faa2e81574c0ff6fb9353f20fd880959';

console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('PAYSTACK_PUBLIC_KEY configured as:', PAYSTACK_PUBLIC_KEY);

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/users/login`,
  REGISTER: `${API_BASE_URL}/api/users/register`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/users/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/users/reset-password`,
  
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
  API_BASE_URL,
  PAYSTACK_PUBLIC_KEY
}; 