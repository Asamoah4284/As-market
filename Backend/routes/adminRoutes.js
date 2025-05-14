const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { adminProtect } = require('../middleware/adminAuth');

// Get all products with pagination for admin
router.get('/products', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('seller', 'name email');
      
    const total = await Product.countDocuments();
    
    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product featured status
router.put('/products/:id/featured', adminProtect, async (req, res) => {
  try {
    const { featuredType, featuredRank, discountPercentage, onSale } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update featured fields
    if (featuredType !== undefined) product.featuredType = featuredType;
    if (featuredRank !== undefined) product.featuredRank = featuredRank;
    if (discountPercentage !== undefined) product.discountPercentage = discountPercentage;
    if (onSale !== undefined) product.onSale = onSale;
    
    const updatedProduct = await product.save();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product featured status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Batch update featured products
router.post('/products/featured/batch', adminProtect, async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Invalid updates data' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { productId, featuredType, featuredRank } = update;
      
      if (!productId) continue;
      
      const product = await Product.findById(productId);
      
      if (!product) {
        results.push({ productId, success: false, message: 'Product not found' });
        continue;
      }
      
      if (featuredType !== undefined) product.featuredType = featuredType;
      if (featuredRank !== undefined) product.featuredRank = featuredRank;
      
      await product.save();
      results.push({ productId, success: true });
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error batch updating featured products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 