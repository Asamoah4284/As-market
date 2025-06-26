const Product = require('../models/productModel');
const User = require('../models/User');
const Notification = require('../models/notification');
const asyncHandler = require('express-async-handler');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const ProductViewModel = require('../models/productViewModel');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { sendPushNotification } = require('../utils/pushNotifications');

// Remove top-level await and move to a function
const generateSalt = async () => {
  return await bcrypt.genSalt(12);
};

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

  const { 
    name, 
    description, 
    price, 
    category, 
    stock, 
    image, 
    additionalImages, 
    isService,
    gender,
    color 
  } = req.body;

  // Check if user is a seller
  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'seller') {
    res.status(403);
    throw new Error('Not authorized as a seller');
  }

  // Calculate commission and final price
  let sellerPrice = Number(price);
  let commission = 0;
  let finalPrice = sellerPrice;

  if (!isService) {
    // Add 5% commission + 1 GHS for products and round up to next whole number + .99
    commission = (sellerPrice * 0.05) + 1;
    finalPrice = Math.ceil(sellerPrice + commission) + 0.99; // Round up and add .99 for marketing strategy
  }

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
    sellerPrice,
    price: finalPrice,
    commission,
    mainCategory: category, // Store seller's category choice as mainCategory
    stock: isService ? 1 : stock, // Services always have stock of 1
    image: mainImageUrl,
    additionalImages: additionalImageUrls,
    isService,
    seller: req.user._id,
    status: 'pending', // Always start as pending
    gender: isService ? undefined : gender, // Only include gender for products
    color: isService ? undefined : color // Only include color for products
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
    // Create a copy of the product to modify
    const productResponse = product.toObject();
    
    // Only hide commission amount for non-admin users
    if (!req.user || req.user.role !== 'admin') {
      delete productResponse.commission;
    }
    
    res.json(productResponse);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    price, 
    category, 
    stock, 
    image, 
    additionalImages, 
    isService,
    gender,
    color 
  } = req.body;

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

  // Calculate new commission and price if price is being updated
  if (price !== undefined) {
    const newSellerPrice = Number(price);
    let newCommission = 0;
    let newFinalPrice = newSellerPrice;

    if (!product.isService) {
      newCommission = (newSellerPrice * 0.05) + 1;
      newFinalPrice = Math.ceil(newSellerPrice + newCommission) + 0.99;
    }

    product.sellerPrice = newSellerPrice;
    product.commission = newCommission;
    product.price = newFinalPrice;
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.mainCategory = category || product.mainCategory;
  product.stock = isService ? 1 : (stock || product.stock);
  product.image = mainImageUrl;
  product.additionalImages = additionalImageUrls;
  product.isService = isService !== undefined ? isService : product.isService;
  
  // Only update gender and color for products
  if (!product.isService) {
    product.gender = gender || product.gender;
    product.color = color || product.color;
  }

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
  
  // Transform products based on user role
  const transformedProducts = products.map(product => {
    const productObj = product.toObject();
    
    // Only hide commission amount for non-admin users
    if (!req.user || req.user.role !== 'admin') {
      delete productObj.commission;
    }
    
    return productObj;
  });
  
  res.json(transformedProducts);
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
    discountPercentage,
    subcategory,
    category,
    categoryId
  } = req.body;

  // Check if user is admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }

  // First check if product exists
  const existingProduct = await Product.findById(req.params.id).populate('seller', 'name');
  if (!existingProduct) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Build update object with only defined fields
  const updateData = {};
  
  // Update status related fields
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
  }

  // Update category related fields
  if (category !== undefined && category !== null) {
    updateData.category = category;
  }

  if (categoryId !== undefined && categoryId !== null) {
    updateData.categoryId = categoryId;
  }

  // Update subcategory
  if (subcategory !== undefined) {
    updateData.subcategory = subcategory || null;
  }

  // Update featured related fields
  if (featuredType !== undefined) {
    updateData.featuredType = featuredType;
  }

  if (featuredRank !== undefined) {
    updateData.featuredRank = featuredRank;
  }

  // Update sale related fields
  if (onSale !== undefined) {
    updateData.onSale = onSale;
  }

  if (discountPercentage !== undefined) {
    updateData.discountPercentage = discountPercentage;
  }

  // Use findByIdAndUpdate to bypass any schema defaults
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { 
      new: true, // Return the updated document
      runValidators: true // Run schema validators
    }
  ).populate('seller', 'name');

  // Send notification to all users when product is approved
  if (status === 'approved') {
    console.log('Product approved, starting notification process...');
    try {
      // Get all users with push tokens (excluding the seller)
      const allUsers = await User.find({ 
        pushToken: { $exists: true, $ne: null },
        _id: { $ne: existingProduct.seller._id } // Exclude the seller
      });

      console.log(`Found ${allUsers.length} users with push tokens`);

      if (allUsers.length > 0) {
        const pushTokens = allUsers.map(user => user.pushToken);
        const sellerName = existingProduct.seller.name || 'A seller';
        const productName = existingProduct.name;
        
        console.log('Sending notifications with data:', {
          sellerName,
          productName,
          pushTokensCount: pushTokens.length,
          productId: existingProduct._id
        });
        
        const notificationTitle = 'New Product Available';
        const notificationBody = `${sellerName} just added a new product: ${productName}`;
        
        // Send push notifications to all users
        const tickets = await sendPushNotification(
          pushTokens,
          notificationTitle,
          notificationBody,
          {
            type: 'NEW_PRODUCT',
            productId: existingProduct._id,
            sellerName,
            productName
          }
        );

        console.log('Push notification tickets:', tickets);

        // Create notification records for all users
        const notificationPromises = allUsers.map(user => 
          Notification.create({
            recipient: 'user',
            recipientId: user._id,
            title: notificationTitle,
            body: notificationBody,
            type: 'NEW_PRODUCT',
            data: {
              productId: existingProduct._id,
              sellerName,
              productName
            },
            pushTokens: [user.pushToken],
            delivered: true
          })
        );

        await Promise.all(notificationPromises);
        
        console.log(`Successfully sent new product notification to ${allUsers.length} users`);
      } else {
        console.log('No users found with push tokens to send notifications to');
      }
    } catch (error) {
      console.error('Error sending new product notifications:', error);
      console.error('Error details:', error.stack);
      // Don't fail the product approval if notification fails
    }
  } else {
    console.log(`Product status changed to: ${status} (not approved, no notifications sent)`);
  }
  
  res.json(updatedProduct);
});

// @desc    Increment product views with 1-hour cooldown per user
// @route   POST /api/products/:id/views
// @access  Public
const incrementProductViews = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;
  
  // Get user identifier (either userId or IP address)
  const userIdentifier = req.user?._id?.toString() || req.ip;

  // Check if there's a recent view (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentView = await ProductViewModel.findOne({
    productId,
    userIdentifier,
    viewedAt: { $gte: oneHourAgo }
  });

  if (recentView) {
    // View already counted within the last hour
    const product = await Product.findById(productId);
    return res.json({ views: product.views, message: 'View already counted' });
  }

  // Create new view record
  await ProductViewModel.create({
    productId,
    userId: req.user?._id, // Will be undefined for anonymous users
    userIdentifier,
    viewedAt: new Date()
  });

  // Increment product views
  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { views: 1 } },
    { new: true, runValidators: false }
  );

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ views: product.views, message: 'View counted' });
});

module.exports = {
  createProduct,
  getSellerProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProducts,
  adminUpdateProduct,
  incrementProductViews,
  generateSalt // Export the function if needed
}; 