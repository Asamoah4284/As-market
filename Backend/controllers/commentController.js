const Comment = require('../models/Comment');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all comments for a product
// @route   GET /api/products/:productId/comments
// @access  Public
const getProductComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ product: req.params.productId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  
  res.json(comments);
});

// @desc    Create a new comment for a product
// @route   POST /api/products/:productId/comments
// @access  Private
const createProductComment = asyncHandler(async (req, res) => {
  console.log('Creating comment for product:', req.params.productId);
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  const { text, rating } = req.body;
  
  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Create new comment
  const comment = await Comment.create({
    product: req.params.productId,
    user: req.user._id,
    text,
    rating: rating || undefined
  });
  
  // Populate user info
  await comment.populate('user', 'name email');
  
  // If rating is provided, update product rating
  if (rating) {
    // Get all ratings for this product
    const comments = await Comment.find({ product: req.params.productId, rating: { $exists: true } });
    
    if (comments.length > 0) {
      const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
      const averageRating = totalRating / comments.length;
      
      // Update product rating
      product.rating = averageRating;
      await product.save();
    }
  }
  
  res.status(201).json(comment);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  
  // Check if user owns the comment or is admin
  if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }
  
  await comment.deleteOne();
  res.json({ message: 'Comment removed' });
});

module.exports = {
  getProductComments,
  createProductComment,
  deleteComment
}; 