const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  linkType: { type: String, enum: ['seller', 'product'], required: true },
  linkId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String },
  description: { type: String },
  buttonText: { type: String },
  expiryDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Banner', bannerSchema); 