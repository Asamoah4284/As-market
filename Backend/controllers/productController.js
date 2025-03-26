const Product = require('../models/productModel');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Seller
const createProduct = asyncHandler(async (req, res) => {
  // Check if user exists in the request
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, please login');
  }

  const { name, description, price, category, stock, image, additionalImages, isService } = req.body;

  // Check if user is a seller
  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'seller') {
    res.status(403);
    throw new Error('Not authorized as a seller');
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    stock: isService ? 1 : stock, // Services always have stock of 1
    image,
    additionalImages,
    isService,
    seller: req.user._id
  });

  if (product) {
    res.status(201).json(product);
  } else {
    res.status(400);
    throw new Error('Invalid product data');
  }
});

// @desc    Get all products for a seller
// @route   GET /api/products/seller
// @access  Private/Seller
const getSellerProducts = asyncHandler(async (req, res) => {
  // Check if user exists and is a seller
  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'seller') {
    res.status(403);
    throw new Error('Not authorized as a seller');
  }

  const products = await Product.find({ seller: req.user._id });
  res.json(products);
});

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name email');
  
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock, image, additionalImages, isService } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if the logged-in user is the seller of this product
  if (product.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.stock = isService ? 1 : (stock || product.stock);
  product.image = image || product.image;
  product.additionalImages = additionalImages || product.additionalImages;
  product.isService = isService !== undefined ? isService : product.isService;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if the logged-in user is the seller of this product
  if (product.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  await product.deleteOne();
  res.json({ message: 'Product removed' });
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).populate('seller', 'name');
  res.json(products);
});

module.exports = {
  createProduct,
  getSellerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProducts
}; 