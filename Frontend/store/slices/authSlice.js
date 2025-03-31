import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userToken: null,
  userData: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userToken = action.payload.token;
      state.userData = action.payload.userData;
    },
    logout: (state) => {
      state.userToken = null;
      state.userData = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer; 