const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  testPaystackConnection,
  initializePayment,
  getAllOrders,
  getOrdersBySellerId
} = require('../controllers/orderController');

// Test routes
router.get('/test-paystack', testPaystackConnection);
router.post('/initialize-payment', protect, initializePayment);

// Order routes
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getAllOrders);

router.route('/myorders')
  .get(protect, getMyOrders);

// This route must come before /:id to avoid conflicts
router.route('/seller/:sellerId')
  .get(protect, getOrdersBySellerId);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, admin, updateOrderStatus);

module.exports = router; 