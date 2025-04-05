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

// Route for featured collections and special categories
router.get('/featured', async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    let limit = 10; // Default limit
    
    switch(type) {
      case 'new-arrivals':
        query.featuredType = 'new-arrivals';
        break;
      case 'featured':
        query.featuredType = 'featured';
        break;
      case 'services':
        query.isService = true;
        query.featuredType = 'featured-service';
        break;
      case 'trending':
        query.featuredType = 'trending';
        break;
      case 'special-offers':
        query.featuredType = 'special-offers';
        break;
      case 'new-season':
        query.featuredType = 'new-season';
        break;
      case 'premium':
        query.featuredType = 'premium';
        break;
      default:
        // Return all featured items if no specific type requested
        query.featuredType = { $exists: true, $ne: null };
    }
    
    const products = await Product.find(query)
      .sort({ featuredRank: 1 }) // Sort by admin-defined ranking
      .limit(limit);
      
    res.json(products);
  } catch (error) {
    console.error(`Error fetching ${req.query.type || 'featured'} products:`, error);
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