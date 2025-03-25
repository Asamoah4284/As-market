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

// Public routes
router.get('/', getProducts);

// Protected routes
router.post('/', protect, createProduct);
router.get('/seller', protect, getSellerProducts);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

// This should come after /seller to avoid conflicts
router.get('/:id', getProductById);

module.exports = router; 