const Notification = require('../models/notification');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { sendPushNotification } = require('../utils/pushNotifications');

// Create a new notification
const createNotification = asyncHandler(async (req, res) => {
  const { recipient, recipientId, title, body, type, data } = req.body;

  if (!recipient || !title || !body || !type) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  // Find user(s) to send notification to
  let pushTokens = [];
  
  if (recipient === 'admin') {
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    pushTokens = admins
      .filter(admin => admin.pushToken)
      .map(admin => admin.pushToken);
    console.log(`Found ${admins.length} admins, ${pushTokens.length} with push tokens`);
  } else if (recipientId) {
    // Find specific user
    const user = await User.findById(recipientId);
    if (user && user.pushToken) {
      pushTokens.push(user.pushToken);
    }
  }

  // Create notification in database
  const notification = await Notification.create({
    recipient,
    recipientId,
    title,
    body,
    type,
    data: data || {},
    pushTokens,
  });

  // Send push notifications to all tokens
  if (pushTokens.length > 0) {
    try {
      console.log(`Sending push notifications to ${pushTokens.length} tokens`);
      const tickets = await sendPushNotification(pushTokens, title, body, { 
        ...data, 
        notificationId: notification._id,
        type 
      });
      console.log('Push notification tickets:', tickets);
      notification.delivered = true;
      await notification.save();
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  } else {
    console.log('No push tokens found for recipient');
  }

  res.status(201).json(notification);
});

// Get notifications for a specific recipient (admin, user, seller)
const getNotifications = asyncHandler(async (req, res) => {
  const { recipient } = req.params;
  const userId = req.user._id;

  let query = { recipient };
  
  // If recipient is a specific user/seller, include their ID in the query
  if (recipient === 'user' || recipient === 'seller') {
    query.recipientId = userId;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 }) // newest first
    .limit(100);

  res.json(notifications);
});

// Mark a notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.read = true;
  await notification.save();

  res.json(notification);
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const { recipient } = req.params;
  const userId = req.user._id;

  let query = { recipient };
  
  if (recipient === 'user' || recipient === 'seller') {
    query.recipientId = userId;
  }

  await Notification.updateMany(query, { read: true });

  res.json({ success: true, message: 'All notifications marked as read' });
});

// Save push token for a user
const savePushToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { pushToken } = req.body;

  if (!pushToken) {
    res.status(400);
    throw new Error('Push token is required');
  }

  const user = await User.findById(userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.pushToken = pushToken;
  await user.save();

  res.json({ success: true, message: 'Push token saved' });
});

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  savePushToken,
}; 