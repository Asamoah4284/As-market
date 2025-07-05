# Push Notifications Guide - Asarion Marketplace

This guide explains how to use the push notification system implemented in your Expo SDK 53 project.

## 🚀 Overview

The push notification system automatically:
- Registers device tokens when the app launches (on real devices only)
- Sends tokens to your backend and saves them to user profiles
- Enables broadcasting notifications to all users with valid tokens
- Works with both iOS and Android devices

## 📱 Frontend Implementation

### Automatic Registration
The system automatically registers push tokens when:
1. **App launches** - If user is already logged in
2. **User logs in** - Push token is registered immediately after successful login
3. **User signs up** - Push token is registered when they log in for the first time

### Key Features
- ✅ **Real devices only** - Won't run in Expo Go (as requested)
- ✅ **Android notification channels** - Properly configured
- ✅ **Permission handling** - Requests permissions gracefully
- ✅ **Error handling** - Robust error handling with logging

### Files Modified
- `Frontend/services/notificationService.js` - Main notification service
- `Frontend/utils/authUtils.js` - Authentication utilities
- `Frontend/App.js` - App-level push token registration
- `Frontend/screens/LoginScreen.js` - Login success handling

## 🔧 Backend Implementation

### New API Endpoints

#### 1. Register Push Token
```http
POST /api/users/push-token
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "userId": "user_id_here",
  "pushToken": "ExponentPushToken[xxx]"
}
```

#### 2. Broadcast Notification (Admin Only)
```http
POST /api/users/broadcast-notification
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "🎉 New Product Alert!",
  "body": "Check out our latest arrival!",
  "data": {
    "type": "NEW_PRODUCT",
    "productId": "12345",
    "action": "view_product"
  }
}
```

### Files Modified
- `Backend/controllers/userController.js` - Added push token and broadcast functions
- `Backend/routes/userRoutes.js` - Added new routes
- `Backend/models/User.js` - Already had `pushToken` field

## 🎯 Usage Examples

### Example 1: Broadcast New Product Announcement
```javascript
// Using curl
curl -X POST http://your-api-url/api/users/broadcast-notification \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎉 New Product Alert!",
    "body": "Check out our latest arrival - Amazing Product with 50% off!",
    "data": {
      "type": "NEW_PRODUCT",
      "productId": "12345",
      "action": "view_product"
    }
  }'
```

### Example 2: Broadcast Sale Announcement
```javascript
// Using JavaScript/Node.js
const axios = require('axios');

async function broadcastSale() {
  try {
    const response = await axios.post(
      'http://your-api-url/api/users/broadcast-notification',
      {
        title: '🔥 Flash Sale Alert!',
        body: 'Limited time offer - Up to 70% off on selected items!',
        data: {
          type: 'SALE',
          saleId: 'flash-sale-2024',
          action: 'view_sale'
        }
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Broadcast successful:', response.data);
  } catch (error) {
    console.error('Broadcast failed:', error.response?.data || error.message);
  }
}
```

### Example 3: Check Users with Push Tokens
```javascript
// MongoDB query to see users with push tokens
db.users.find(
  { pushToken: { $ne: null, $exists: true } },
  { name: 1, email: 1, pushToken: 1, role: 1 }
)
```

## 🔍 Testing

### 1. Install Your Published App
Make sure you test with the actual published app (from Play Store .aab), not Expo Go.

### 2. Check Push Token Registration
- Open your app logs to see push token registration
- Check your MongoDB `users` collection to verify `pushToken` field is populated

### 3. Test Broadcast Notifications
- Use an admin account to call the broadcast endpoint
- Check that all users with valid push tokens receive the notification

## 📊 Monitoring

### Backend Logs
The system logs important events:
- Push token registration success/failure
- Broadcast notification attempts
- Individual notification delivery status

### Frontend Logs
Monitor the console for:
- Push token generation
- Permission requests
- Token sending to backend

## 🚨 Important Notes

1. **Real Devices Only**: Push notifications only work on physical devices, not in Expo Go
2. **Project ID**: Make sure your `projectId` is correctly set in your Expo configuration
3. **Permissions**: The system handles permission requests automatically
4. **Token Expiration**: Expo push tokens can expire; the system handles re-registration
5. **Rate Limits**: Expo has rate limits for push notifications (1000 per hour for free tier)

## 🔐 Security

- Push token endpoint requires user authentication
- Broadcast endpoint requires admin authentication
- All endpoints use proper error handling
- No sensitive information is logged

## 📋 Troubleshooting

### Push Token is null in database
- Check that the app is running on a real device
- Verify user is logged in when token registration occurs
- Check console logs for permission errors

### Notifications not received
- Verify push token is valid in database
- Check Expo push notification status
- Ensure proper project ID configuration

### Permission denied errors
- Check device notification settings
- Verify app has notification permissions
- Try clearing app data and re-registering

## 🎉 Success!

Your push notification system is now fully implemented and ready to use. Users will automatically have their push tokens registered when they use your published app on real devices, and you can broadcast notifications to all users through the admin API. 