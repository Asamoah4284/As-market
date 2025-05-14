const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register User
const registerUser = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, phone, password, role } = req.body;

    // Check if at least email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required' });
    }

    // Check if user exists with email or phone
    const existingUser = email 
      ? await User.findOne({ email }) 
      : await User.findOne({ phone });
      
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    console.log('Attempting to save user:', user);
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser);

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Check if either email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    // Find user by email or phone
    const user = email 
      ? await User.findOne({ email }) 
      : await User.findOne({ phone });
      
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    // No need to fetch the user again, it's already in req.user from the middleware
    console.log('User profile accessed:', req.user._id);
    
    // Create response with both name and username fields
    const userResponse = {
      _id: req.user._id,
      name: req.user.name,
      username: req.user.name, // Add username as alias for name
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role
    };
    
    console.log('Sending user profile response:', userResponse);
    res.json(userResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add this to your auth middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  deleteUser,
  admin
}; 