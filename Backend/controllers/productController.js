const Product = require('../models/productModel');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (base64Image) => {
  try {
    if (!base64Image) {
      throw new Error('No image data provided');
    }

    // Remove the data:image/format;base64, prefix if it exists
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    let compressedImageBuffer;
    try {
      compressedImageBuffer = await sharp(Buffer.from(base64Data, 'base64'))
        .resize(800) // Resize to max width of 800px
        .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
        .toBuffer();
    } catch (sharpError) {
      console.error('Error compressing image:', sharpError);
      throw new Error(`Image compression failed: ${sharpError.message}`);
    }

    // Upload to Cloudinary with timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'campus-market',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(compressedImageBuffer);
    });

    if (!result || !result.secure_url) {
      throw new Error('Cloudinary response is missing secure_url');
    }

    console.log('Upload successful:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error; // Throw the specific error instead of a generic one
  }
};

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

  // Add 5% to the original price
  const finalPrice = Math.round((Number(price) * 1.05) * 100) / 100;

  // Upload main image to Cloudinary
  let mainImageUrl;
  if (image) {
    mainImageUrl = await uploadToCloudinary(image);
  }

  // Upload additional images to Cloudinary
  let additionalImageUrls = [];
  if (additionalImages && additionalImages.length > 0) {
    additionalImageUrls = await Promise.all(
      additionalImages.map(img => uploadToCloudinary(img))
    );
  }

  const product = await Product.create({
    name,
    description,
    price: finalPrice,
    category,
    stock: isService ? 1 : stock, // Services always have stock of 1
    image: mainImageUrl,
    additionalImages: additionalImageUrls,
    isService,
    seller: req.user._id,
    status: 'pending' // Always start as pending
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

  // Only upload new images if they've changed (they'll be base64 strings if new)
  let mainImageUrl = product.image;
  if (image && image.startsWith('data:image')) {
    mainImageUrl = await uploadToCloudinary(image);
  }

  let additionalImageUrls = product.additionalImages;
  if (additionalImages && additionalImages.length > 0) {
    additionalImageUrls = await Promise.all(
      additionalImages.map(async (img) => {
        if (img.startsWith('data:image')) {
          return await uploadToCloudinary(img);
        }
        return img; // Keep existing URL if not a new image
      })
    );
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.stock = isService ? 1 : (stock || product.stock);
  product.image = mainImageUrl;
  product.additionalImages = additionalImageUrls;
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

  // Delete images from Cloudinary
  if (product.image) {
    const publicId = product.image.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }

  if (product.additionalImages && product.additionalImages.length > 0) {
    await Promise.all(
      product.additionalImages.map(async (img) => {
        const publicId = img.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      })
    );
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

// @desc    Admin approve or reject a product and set featured status
// @route   PUT /api/products/admin-update/:id
// @access  Private/Admin
const adminUpdateProduct = asyncHandler(async (req, res) => {
  const { 
    status, 
    rejectionReason, 
    featuredType, 
    featuredRank,
    onSale,
    discountPercentage
  } = req.body;

  // Check if user is admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Update status related fields
  if (status) {
    product.status = status;
    
    if (status === 'rejected' && rejectionReason) {
      product.rejectionReason = rejectionReason;
    }
  }

  // Update featured related fields
  if (featuredType !== undefined) {
    product.featuredType = featuredType;
  }

  if (featuredRank !== undefined) {
    product.featuredRank = featuredRank;
  }

  // Update sale related fields
  if (onSale !== undefined) {
    product.onSale = onSale;
  }

  if (discountPercentage !== undefined) {
    product.discountPercentage = discountPercentage;
  }

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

module.exports = {
  createProduct,
  getSellerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProducts,
  adminUpdateProduct
}; 