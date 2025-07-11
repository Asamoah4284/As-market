import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  pushToken: null,
  isPermissionGranted: false,
  isLoading: false,
  error: null,
};

// Helper function to generate unique IDs with a counter to ensure uniqueness
let notificationCounter = 0;
const generateUniqueId = () => {
  const timestamp = Date.now();
  notificationCounter++;
  return `${timestamp}-${notificationCounter}`;
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    setPermissionStatus: (state, action) => {
      state.isPermissionGranted = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: action.payload.id || generateUniqueId(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (notification) => notification.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setPushToken,
  setPermissionStatus,
  setLoading,
  setError,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer; 