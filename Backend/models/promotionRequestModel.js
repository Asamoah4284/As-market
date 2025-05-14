const mongoose = require('mongoose');

const promotionRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bannerUrl: {
    type: String,
    required: true,
  },
  bannerPublicId: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'paid',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: false,
  }
});

const PromotionRequest = mongoose.model('PromotionRequest', promotionRequestSchema);

module.exports = PromotionRequest;