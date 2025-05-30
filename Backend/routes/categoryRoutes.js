const express = require('express');
const router = express.Router();
const Product = require('../models/productModel'); // Adjust path as needed

// Get all categories
router.get('/', async (req, res) => {
  try {
    // Get categories from Product model to ensure consistency
    const categories = Product.getCategories();
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category ID
router.get('/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Build query object
    const query = {
      status: 'approved' // Only return approved products
    };
    
    // Add category filter if provided and not 'all'
    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }
    
    // Find products matching the query
    const products = await Product.find(query)
      .populate('seller', 'name')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available categories for admin use (when assigning products)
router.get('/admin/available', async (req, res) => {
  try {
    const categories = Product.getCategories();
    
    // Return simplified format for admin dropdown/selection
    const adminCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      displayName: `${cat.name} (${cat.id})`
    }));
    
    res.json(adminCategories);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;