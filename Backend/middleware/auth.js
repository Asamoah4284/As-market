const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token provided in Authorization header');
  }
});

// Admin middleware
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

// Middleware to check if user is admin or seller of the order
const adminOrSeller = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
    return;
  }

  if (req.user.role !== 'seller') {
    res.status(403);
    throw new Error('Not authorized. Admin or seller role required.');
  }

  // For sellers, verify they own the order
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if any item in the order belongs to this seller
  const isOrderSeller = order.items.some(item => 
    item.sellerId && item.sellerId.toString() === req.user._id.toString()
  );

  if (!isOrderSeller) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  next();
});

module.exports = { 
  protect, 
  admin, 
  adminOrSeller 
}; 