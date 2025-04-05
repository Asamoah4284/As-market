const express = require('express');
const router = express.Router();
const { getSellerProfile, updateSellerProfile } = require('../controllers/sellerController');

// Use the controller functions as route handlers
router.get('/profile', getSellerProfile);

router.put('/profile', updateSellerProfile);

// Add other seller routes as needed

module.exports = router; 