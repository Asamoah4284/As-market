const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth'); // Assuming you have auth middleware

router.post('/add', protect, cartController.addToCart);
router.get('/', protect, cartController.getCartItems);
router.put('/:id', protect, cartController.updateCartItem);
router.delete('/:id', protect, cartController.removeFromCart);

module.exports = router; 