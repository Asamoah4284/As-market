const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect admin routes
const adminProtect = async (req, res, next) => {
  try {
    // First run the regular auth protection
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { adminProtect }; 