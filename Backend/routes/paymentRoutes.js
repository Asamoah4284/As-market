const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sensitiveOperationLimiter } = require('../middleware/rateLimiter');
const {
  initializePayment,
  handlePaystackWebhook
} = require('../controllers/paymentController');

// Initialize payment (protected, rate limited)
router.post('/initialize', protect, sensitiveOperationLimiter, initializePayment);

// Paystack webhook (no auth required, but signature validated)
router.post('/webhook/paystack', handlePaystackWebhook);

module.exports = router; 