const express = require('express');
const router = express.Router();
const { getSellerProfile, updateSellerProfile } = require('../controllers/sellerController');
const { protect } = require('../middleware/auth');

// Use the controller functions as route handlers
router.get('/profile', protect, getSellerProfile);

router.put('/profile', protect, updateSellerProfile);

// Add other seller routes as needed

module.exports = router; 