const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
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
      password: hashedPassword,
      role
    });

    await user.save();

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
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
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
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
}; 