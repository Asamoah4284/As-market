const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      enum: ['admin', 'user', 'seller'],
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['ADD_TO_CART', 'ORDER_PLACED', 'PAYMENT_SUCCESSFUL', 'NEW_PRODUCT', 'ADMIN_PAYMENT_RECEIVED'],
    },
    data: {
      type: Object,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    pushTokens: [{
      type: String,
    }],
    delivered: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 