const PromotionRequest = require('../models/promotionRequestModel');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

// Seller: Create a promotion request (after payment)
exports.createPromotionRequest = asyncHandler(async (req, res) => {
  const { duration, bannerImageBase64 } = req.body;
  const userId = req.user.id;

  if (!duration || !bannerImageBase64) {
    res.status(400);
    throw new Error('Duration and banner image are required.');
  }

  // Upload to Cloudinary
  const upload = await cloudinary.uploader.upload(bannerImageBase64, {
    folder: 'store_promotions'
  });

  const promo = await PromotionRequest.create({
    userId,
    bannerUrl: upload.secure_url,
    bannerPublicId: upload.public_id,
    duration,
    paymentStatus: 'paid',
    approvalStatus: 'pending',
    createdAt: new Date()
  });

  res.status(201).json(promo);
});

// Admin: List all promotion requests (optionally filter by status)
exports.listPromotionRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { approvalStatus: status } : {};
  const promos = await PromotionRequest.find(filter).populate('userId', 'name email');
  res.json(promos);
});

// Admin: Approve a promotion request
exports.approvePromotionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const promo = await PromotionRequest.findById(id);
  if (!promo) {
    res.status(404);
    throw new Error('Promotion request not found');
  }
  promo.approvalStatus = 'approved';
  promo.isActive = true;
  promo.startDate = new Date();
  // Set endDate based on your duration logic, e.g., 7 days
  promo.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await promo.save();
  res.json({ message: 'Promotion approved', promo });
});

// Admin: Reject a promotion request
exports.rejectPromotionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const promo = await PromotionRequest.findById(id);
  if (!promo) {
    res.status(404);
    throw new Error('Promotion request not found');
  }
  promo.approvalStatus = 'rejected';
  promo.rejectionReason = reason || 'No reason provided';
  promo.isActive = false;
  await promo.save();
  res.json({ message: 'Promotion rejected', promo });
});