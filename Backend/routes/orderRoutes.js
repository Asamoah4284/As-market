const express = require('express');
const router = express.Router();
const { protect, admin, adminOrSeller } = require('../middleware/auth');
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
router.route('/seller/me')
  .get(protect, async (req, res, next) => {
    // Add seller role check
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller role required.' });
    }
    req.params.sellerId = req.user._id;
    next();
  }, getOrdersBySellerId);

router.route('/seller/:sellerId')
  .get(protect, admin, getOrdersBySellerId); // Only admin can view other sellers' orders

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, adminOrSeller, updateOrderStatus);

module.exports = router; 