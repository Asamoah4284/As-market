const mongoose = require('mongoose');

const productViewModelSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make userId optional
  },
  userIdentifier: {
    type: String, // Will store either userId or IP address
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Create a compound index to ensure uniqueness of product-user pairs within 1 hour
productViewModelSchema.index(
  { productId: 1, userIdentifier: 1, viewedAt: 1 },
  { 
    expireAfterSeconds: 3600 // Automatically delete documents after 1 hour
  }
);

// Create a compound index for efficient querying
productViewModelSchema.index({ productId: 1, userIdentifier: 1 });

const ProductViewModel = mongoose.model('ProductViewModel', productViewModelSchema);

module.exports = ProductViewModel; 