const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // temp local storage, then upload to Cloudinary

// Create banner (admin, with image upload)
router.post('/', upload.single('image'), bannerController.createBanner);

// Get active banners (public)
router.get('/', bannerController.getActiveBanners);

// Delete banner (admin)
router.delete('/:id', bannerController.deleteBanner);

module.exports = router; 