const User = require('../models/User');
const Seller = require('../models/Seller');

// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Not a seller account.' });
    }

    // Find seller profile or create one if it doesn't exist
    let sellerProfile = await Seller.findOne({ user: req.user._id });
    
    if (!sellerProfile) {
      // Create a default seller profile
      sellerProfile = new Seller({
        user: req.user._id,
        bio: '',
        location: '',
        avatar: null,
        joinDate: new Date(),
        totalSales: 0,
        rating: 0,
        followers: 0,
        isPremium: false
      });
      await sellerProfile.save();
    }

    // Combine user data with seller profile
    const profileData = {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      bio: sellerProfile.bio,
      location: sellerProfile.location,
      joinDate: sellerProfile.joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalSales: sellerProfile.totalSales,
      rating: sellerProfile.rating,
      avatar: sellerProfile.avatar,
      followers: sellerProfile.followers,
      isPremium: sellerProfile.isPremium
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update seller profile
const updateSellerProfile = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Not a seller account.' });
    }

    const { name, email, phone, bio, location, avatar } = req.body;

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create seller profile
    let sellerProfile = await Seller.findOne({ user: req.user._id });
    
    if (!sellerProfile) {
      sellerProfile = new Seller({
        user: req.user._id,
        bio: bio || '',
        location: location || '',
        avatar: avatar || null,
        joinDate: new Date(),
        totalSales: 0,
        rating: 0,
        followers: 0,
        isPremium: false
      });
    } else {
      // Update seller profile
      sellerProfile.bio = bio || sellerProfile.bio;
      sellerProfile.location = location || sellerProfile.location;
      
      // Only update avatar if a new one is provided
      if (avatar) {
        sellerProfile.avatar = avatar;
      }
    }

    await sellerProfile.save();

    // Combine updated user data with seller profile for response
    const updatedProfile = {
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: sellerProfile.bio,
      location: sellerProfile.location,
      joinDate: sellerProfile.joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalSales: sellerProfile.totalSales,
      rating: sellerProfile.rating,
      avatar: sellerProfile.avatar,
      followers: sellerProfile.followers,
      isPremium: sellerProfile.isPremium
    };

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating seller profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSellerProfile,
  updateSellerProfile
}; 