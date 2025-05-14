const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
// const { protectSeller, protectAdmin } = require('../middleware/authMiddleware');

// Seller route
router.post('/', promotionController.createPromotionRequest);

// Admin routes
router.get('/', promotionController.listPromotionRequests);
router.put('/:id/approve', promotionController.approvePromotionRequest);
router.put('/:id/reject', promotionController.rejectPromotionRequest);

module.exports = router;