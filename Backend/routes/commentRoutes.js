const express = require('express');
const router = express.Router();
const { 
  getProductComments, 
  createProductComment, 
  deleteComment 
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Routes for specific product comments
router.route('/products/:productId/comments')
  .get(getProductComments)
  .post(protect, createProductComment);

// Route for managing individual comments
router.route('/comments/:id')
  .delete(protect, deleteComment);

module.exports = router;