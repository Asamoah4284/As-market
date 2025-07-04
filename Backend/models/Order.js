const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: String,
    image: String,
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sellerPhone: {
      type: String
    }
  }],
  shippingAddress: {
location: {
      type: String,
      required: true,
      enum: ['OLD SITE', 'NEW SITE', 'AYENSU', 'AMAMOMA', 'KWAPRO', 'VALCO', 'ADEHYE3', 'SUPERNUATION', 'SRC', 'CASLEY HAYFORD', 'ATL', 'OGUAA', 'KNH']
    },
    roomNumber: String,
    additionalInfo: String
  },
  preferredDeliveryDay: {
    type: Date
  },
  buyerContact: {
    phone: String,
    alternativePhone: String
  },
  paymentInfo: {
    reference: {
      type: String,
      required: true,
      unique: true
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'GHS'
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'pay_on_delivery', 'online'],
      default: 'paystack'
    },
    paidAt: Date
  },
  totalAmount: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveredAt: Date
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 