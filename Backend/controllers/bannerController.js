const Banner = require('../models/Banner');
const cloudinary = require('../config/cloudinary');

// Create a new banner (admin only)
exports.createBanner = async (req, res) => {
  try {
    let imageUrl = req.body.image;
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'banners',
      });
      imageUrl = result.secure_url;
    }
    const { linkType, linkId, title, description, buttonText, expiryDate } = req.body;
    const banner = new Banner({
      image: imageUrl,
      linkType,
      linkId,
      title,
      description,
      buttonText,
      expiryDate,
    });
    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active banners (expiryDate > now)
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({ expiryDate: { $gt: now } });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a banner (admin only)
exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 