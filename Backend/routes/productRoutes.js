const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getSellerProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getProducts
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const Product = require('../models/productModel');

// Public routes
router.get('/', async (req, res) => {
  try {
    const { category, isService } = req.query;
    
    // Build query object
    const query = {};
    
    // Add category filter if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Add service/product filter if provided
    if (isService !== undefined) {
      query.isService = isService === 'true';
    }
    
    // Find products matching the query
    const products = await Product.find(query);
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected routes
router.post('/', protect, createProduct);
router.get('/seller', protect, getSellerProducts);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

// This should come after /seller to avoid conflicts
router.get('/:id', getProductById);

module.exports = router; 