const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  savePushToken,
} = require('../controllers/notificationController');

// Create a new notification (admin only)
router.post('/', adminProtect, createNotification);

// Public endpoint for admin notifications
router.post('/admin-notification', createNotification);

// Public endpoint for registering admin push token
router.post('/admin-token', async (req, res) => {
  try {
    const { pushToken, adminKey } = req.body;
    
    // Basic validation
    if (!pushToken || !adminKey) {
      return res.status(400).json({ 
        message: 'Push token and admin key are required' 
      });
    }
    
    // Verify admin key (this is a simple security measure)
    // In production, use a more secure approach
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'asarion_admin_key') {
      return res.status(403).json({ 
        message: 'Invalid admin key' 
      });
    }
    
    const User = require('../models/User');
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    
    if (admins.length === 0) {
      return res.status(404).json({ 
        message: 'No admin users found' 
      });
    }
    
    // Update all admin users with the push token
    for (const admin of admins) {
      admin.pushToken = pushToken;
      await admin.save();
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Push token saved for ${admins.length} admin users` 
    });
  } catch (error) {
    console.error('Error saving admin push token:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get notifications for a specific recipient type
router.get('/:recipient', protect, getNotifications);

// Mark a notification as read
router.put('/:id/read', protect, markAsRead);

// Mark all notifications as read for a recipient type
router.put('/:recipient/read-all', protect, markAllAsRead);

// Save push token for a user
router.post('/token', protect, savePushToken);

module.exports = router; 