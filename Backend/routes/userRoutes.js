const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const { protect, admin } = require('../middleware/auth');
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  getAllUsers,
  deleteUser,
  forgotPassword,
  resetPassword
} = require('../controllers/userController');
const { authLimiter, sensitiveOperationLimiter } = require('../middleware/rateLimiter');

// Apply rate limiters to auth routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Password reset routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);

// Admin routes with sensitive operation limiter
router.get('/', protect, admin, sensitiveOperationLimiter, getAllUsers);
router.delete('/:id', protect, admin, sensitiveOperationLimiter, deleteUser);

module.exports = router; 