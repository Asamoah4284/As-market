const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getSellerProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getProducts,
  adminUpdateProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const Product = require('../models/productModel');

// Public routes
router.get('/', async (req, res) => {
  try {
    const { category, isService, status } = req.query;
    
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
    
    // Only show approved products on public routes
    query.status = 'approved';
    
    // Find products matching the query
    const products = await Product.find(query).populate('seller', 'name');
    
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
    let query = { status: 'approved' }; // Only show approved products
    let limit = 10; // Default limit
    
    if (type) {
      query.featuredType = type;
    } else {
      // Return all featured items if no specific type requested
      query.featuredType = { $exists: true, $ne: null };
    }
    
    const products = await Product.find(query)
      .sort({ featuredRank: 1 }) // Sort by admin-defined ranking
      .limit(limit)
      .populate('seller', 'name');
      
    res.json(products);
  } catch (error) {
    console.error(`Error fetching ${req.query.type || 'featured'} products:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new route for pending products (admin only)
router.get('/pending', protect, async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement this check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access pending products' });
    }
    
    const pendingProducts = await Product.find({ status: 'pending' }).populate('seller', 'name');
    res.json(pendingProducts);
  } catch (error) {
    console.error('Error fetching pending products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for admin to approve/reject products
router.put('/approve/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve products' });
    }
    
    const { status, rejectionReason } = req.body;
    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return res.status(400).json({ message: 'Valid status required' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product.status = status;
    if (status === 'rejected' && rejectionReason) {
      product.rejectionReason = rejectionReason;
    }
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enhanced route for admin to approve/reject AND configure product features
router.put('/admin-update/:id', protect, adminUpdateProduct);

// Protected routes
router.post('/', protect, createProduct);
router.get('/seller', protect, getSellerProducts);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

// This should come after all other routes to avoid conflicts
router.get('/:id', getProductById);

module.exports = router; 