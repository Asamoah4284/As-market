const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../config/sendgrid');

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

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
    const salt = await bcrypt.genSalt(15);
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
      process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name);

    if (emailSent) {
      res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } else {
      // Clear the token if email failed to send
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(15);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Push Token
const updatePushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    // Validate input
    if (!userId || !pushToken) {
      return res.status(400).json({ 
        message: 'userId and pushToken are required' 
      });
    }

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Push token updated for user ${userId}: ${pushToken.substring(0, 20)}...`);
    
    res.status(200).json({
      success: true,
      message: 'Push token updated successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Broadcast notification to all users
const broadcastNotification = async (req, res) => {
  try {
    const { title, body, data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({ 
        message: 'title and body are required' 
      });
    }

    // Get all users with valid push tokens
    const users = await User.find({ 
      pushToken: { $ne: null, $exists: true } 
    });

    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'No users with push tokens found' 
      });
    }

    // Prepare push notifications
    const messages = users.map(user => ({
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        userId: user._id.toString()
      }
    }));

    // Send notifications in batches (Expo recommends max 100 at a time)
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });

        const result = await response.json();
        results.push(result);
        
        // Log any errors
        if (result.data) {
          result.data.forEach((receipt, index) => {
            if (receipt.status === 'error') {
              console.error(`Push notification error for user ${batch[index].data.userId}:`, receipt.message);
            }
          });
        }
      } catch (error) {
        console.error(`Error sending batch ${i / batchSize + 1}:`, error);
      }
    }

    console.log(`Broadcast notification sent to ${users.length} users`);
    
    res.status(200).json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      totalUsers: users.length,
      batches: results.length
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  deleteUser,
  admin,
  forgotPassword,
  resetPassword,
  updatePushToken,
  broadcastNotification
}; 