const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  totalSales: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  followers: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.models.Seller || mongoose.model('Seller', sellerSchema); 