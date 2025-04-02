import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const API_URL = 'http://10.10.90.155:5000';


export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (token, { getState }) => {
    try {
      // Check cache first
      const cachedData = await AsyncStorage.getItem('productsCache');
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        
        if (!isExpired) {
          return data;
        }
      }

      // Fetch fresh data if cache is expired or doesn't exist
      const response = await fetch(`${API_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Update cache
      await AsyncStorage.setItem('productsCache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    } catch (error) {
      throw error;
    }
  }
);

// Add new action for fetching single product
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { getState }) => {
    try {
      // Check cache first
      const cachedData = await AsyncStorage.getItem(`product_${productId}`);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        
        if (!isExpired) {
          return data;
        }
      }

      // Fetch fresh data if cache is expired or doesn't exist
      const response = await fetch(`${API_URL}/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      const data = await response.json();
      
      // Update cache
      await AsyncStorage.setItem(`product_${productId}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    } catch (error) {
      throw error;
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    currentProduct: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.currentProduct = null;
      });
  },
});

export default productSlice.reducer; 