// API Configuration
export const API_BASE_URL = 'http://172.20.10.3:5000'; // Replace with your actual backend URL

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

export default API_ENDPOINTS; 