const Order = require('../models/Order');
const Cart = require('../models/cartModel');
const https = require('https');
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const User = require('../models/User');
const { calculateDeliveryFee, calculateFinalTotal } = require('../utils/deliveryFee');

// Paystack secret key
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Verify Paystack payment
const verifyPaystackPayment = async (reference) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Paystack verification response:', response);
          resolve(response);
        } catch (error) {
          console.error('Error parsing Paystack response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Paystack verification request error:', error);
      reject(error);
    });

    req.end();
  });
};

// Test Paystack connection
const testPaystackConnection = asyncHandler(async (req, res) => {
  try {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/verify/dummy_reference',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    };

    const paystackReq = https.request(options, paystackRes => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        res.json({
          message: 'Paystack connection test completed',
          statusCode: paystackRes.statusCode,
          response: JSON.parse(data)
        });
      });
    });

    paystackReq.on('error', (error) => {
      throw new Error(`Paystack connection error: ${error.message}`);
    });

    paystackReq.end();
  } catch (error) {
    res.status(500).json({
      error: 'Failed to connect to Paystack',
      details: error.message
    });
  }
});

// Initialize Paystack transaction
const initializePayment = asyncHandler(async (req, res) => {
  const { amount, email } = req.body;

  if (!amount || !email) {
    res.status(400);
    throw new Error('Amount and email are required');
  }

  try {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const paystackReq = https.request(options, paystackRes => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        res.json(JSON.parse(data));
      });
    });

    paystackReq.on('error', (error) => {
      throw new Error(`Payment initialization error: ${error.message}`);
    });

    const paymentData = JSON.stringify({
      email,
      amount: amount, // Convert to pesewas
      currency: 'GHS',
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    paystackReq.write(paymentData);
    paystackReq.end();
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initialize payment',
      details: error.message
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  try {
    console.log('Creating order with data:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);

    // Validate request body
    if (!req.body) {
      console.error('Empty request body');
      return res.status(400).json({ message: 'Empty request body' });
    }

    const { 
      paymentReference,
      orderItems,
      totalAmount,
      paymentMethod,
      shippingAddress,
      buyerContact,
      preferredDeliveryDay
    } = req.body;

    console.log('Payment method from request:', paymentMethod);
    console.log('Shipping address from request:', shippingAddress);

    // Check for either orderItems or items property
    const items = orderItems || req.body.items;

    // Log item presence and format
    console.log('orderItems property exists:', !!orderItems);
    console.log('items property exists:', !!req.body.items);
    console.log('Final items to use:', items ? `${items.length} items` : 'undefined');
    console.log('Payment method:', paymentMethod);

    if (!items || items.length === 0) {
      console.error('No order items provided in request:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ message: 'No order items provided' });
    }

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Validate that totalAmount includes correct delivery fee
    const expectedTotal = calculateFinalTotal(subtotal);
    const deliveryFee = calculateDeliveryFee(subtotal);
    
    console.log('Order validation:', {
      subtotal,
      deliveryFee,
      expectedTotal,
      providedTotal: totalAmount,
      isCorrect: Math.abs(expectedTotal - totalAmount) < 0.01
    });
    
    // Allow a small tolerance for floating point precision
    if (Math.abs(expectedTotal - totalAmount) >= 0.01) {
      console.error('Delivery fee validation failed:', {
        subtotal,
        expectedTotal,
        providedTotal: totalAmount,
        difference: expectedTotal - totalAmount
      });
      return res.status(400).json({ 
        message: `Invalid total amount. Expected GH₵${expectedTotal.toFixed(2)} (subtotal: GH₵${subtotal.toFixed(2)} + delivery: GH₵${deliveryFee.toFixed(2)})` 
      });
    }

    // Validate required shipping address
    if (!shippingAddress || !shippingAddress.location) {
      console.error('Missing or invalid shipping address:', shippingAddress);
      return res.status(400).json({ message: 'Shipping address with location is required' });
    }

    // For online payments, verify with Paystack
    if (paymentMethod !== 'pay_on_delivery') {
      if (!paymentReference) {
        console.error('No payment reference provided for online payment');
        return res.status(400).json({ message: 'Payment reference is required for online payments' });
      }

      // Verify payment with Paystack
      console.log('Verifying payment with reference:', paymentReference);
      try {
        const paymentVerification = await verifyPaystackPayment(paymentReference);
        console.log('Payment verification response:', paymentVerification);

        if (!paymentVerification.status) {
          return res.status(400).json({ 
            message: 'Payment verification failed: Invalid response from Paystack' 
          });
        }

        if (paymentVerification.data?.status !== 'success') {
          return res.status(400).json({ 
            message: `Payment verification failed: Transaction status is ${paymentVerification.data?.status}` 
          });
        }

        // Get the amount paid from Paystack response (already in pesewas)
        const amountPaidInPesewas = paymentVerification.data?.amount;
        // Convert our order amount to pesewas
        const orderAmountInPesewas = Math.round(totalAmount);

        console.log('Amount Verification:', {
          orderAmountInPesewas,
          amountPaidInPesewas,
          orderAmount: totalAmount,
          amountPaid: paymentVerification.data?.amount / 100
        });
      } catch (verificationError) {
        console.error('Payment verification error:', verificationError);
        return res.status(400).json({ 
          message: `Payment verification failed: ${verificationError.message}` 
        });
      }
    } else {
      console.log('Pay on delivery order - skipping payment verification');
      // For pay-on-delivery, we don't need to verify with Paystack
      if (!paymentReference) {
        // Generate a unique reference for the pay-on-delivery order
        const payOnDeliveryRef = `POD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        req.body.paymentReference = payOnDeliveryRef;
        console.log('Generated pay-on-delivery reference:', payOnDeliveryRef);
      }
    }

    // Prepare items with seller phone numbers
    const itemsWithSellerPhone = await Promise.all((items || []).map(async item => {
      let sellerPhone = '';
      try {
        // Try to get sellerId from item, fallback to product lookup if missing
        let sellerId = item.sellerId;
        if (!sellerId && item.productId) {
          const product = await Product.findById(item.productId).select('seller');
          if (product && product.seller) sellerId = product.seller;
        }
        if (sellerId) {
          const sellerUser = await User.findById(sellerId).select('phone');
          if (sellerUser && sellerUser.phone) sellerPhone = sellerUser.phone;
        }
      } catch (e) {
        console.error('Error fetching seller phone:', e);
      }
      return {
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
        sellerId: item.sellerId,
        sellerPhone
      };
    }));

    // Create order
    const orderData = {
      user: req.user._id,
      items: itemsWithSellerPhone,
      paymentInfo: {
        reference: req.body.paymentReference || paymentReference,
        status: paymentMethod === 'pay_on_delivery' ? 'pending' : 'success',
        amount: totalAmount,
        currency: 'GHS',
        paidAt: paymentMethod === 'pay_on_delivery' ? null : Date.now(),
        paymentMethod: paymentMethod || 'online'
      },
      shippingAddress: shippingAddress,
      buyerContact: buyerContact,
      preferredDeliveryDay: preferredDeliveryDay,
      totalAmount,
      orderStatus: paymentMethod === 'pay_on_delivery' ? 'pending' : 'processing'
    };

    console.log('Creating order with data:', orderData);
    console.log('Payment Method in order data:', orderData.paymentInfo.paymentMethod);
    try {
      const order = new Order(orderData);
      const createdOrder = await order.save();
      console.log('Order created successfully:', createdOrder._id);
      
      // Update stock for each product in the order
      console.log('Starting stock update for order items:', items.length);
      for (const item of items) {
        try {
          // Log the entire item to see its structure
          console.log('Processing order item:', JSON.stringify(item, null, 2));
          
          // Get the product ID - handle both productId (from cart) and _id cases
          const productId = item.productId || item._id;
          if (!productId) {
            console.error('No product ID found in item:', item);
            continue;
          }

          console.log('Looking up product with ID:', productId);
          const product = await Product.findById(productId);
          
          if (!product) {
            console.error(`Product ${productId} not found`);
            continue;
          }

          console.log(`Found product: ${product.name}, current stock: ${product.stock}, isService: ${product.isService}`);

          // Only update stock if it's not a service
          if (!product.isService) {
            // Ensure stock is a number
            const currentStock = Number(product.stock);
            const orderQuantity = Number(item.quantity);

            if (isNaN(currentStock)) {
              console.error(`Invalid stock value for product ${product._id}:`, product.stock);
              continue;
            }

            if (isNaN(orderQuantity)) {
              console.error(`Invalid quantity for product ${product._id}:`, item.quantity);
              continue;
            }

            if (currentStock < orderQuantity) {
              console.error(`Insufficient stock for product ${product._id}. Current: ${currentStock}, Required: ${orderQuantity}`);
              continue;
            }

            // Update stock
            const newStock = currentStock - orderQuantity;
            product.stock = newStock;
            await product.save();
            console.log(`Successfully updated stock for product ${product._id}: ${currentStock} -> ${newStock}`);
          } else {
            console.log(`Product ${product._id} is a service, skipping stock update`);
          }
        } catch (itemError) {
          console.error(`Error updating stock for item:`, itemError);
          // Continue with other products even if one fails
          continue;
        }
      }
      console.log('Completed stock update for all order items');

      // Clear user's cart
      try {
        await Cart.deleteMany({ user: req.user._id });
        console.log('User cart cleared');
      } catch (cartError) {
        console.error('Error clearing cart:', cartError);
        // Continue even if cart clear fails
      }

      return res.status(201).json(createdOrder);
    } catch (orderSaveError) {
      console.error('Error saving order:', orderSaveError);
      return res.status(500).json({ 
        message: 'Failed to save order in database', 
        error: orderSaveError.message 
      });
    }
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(error.status || 500).json({
      message: error.message || 'Failed to create order',
      error: error.stack
    });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching order with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    console.log('User Role:', req.user.role);

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price sellerPrice seller commission');

    if (!order) {
      console.log('Order not found');
      res.status(404);
      throw new Error('Order not found');
    }

    // Allow access if user is admin or if it's their own order
    if (req.user.role === 'admin' || order.user._id.toString() === req.user._id.toString()) {
      console.log('Order found and access granted');
      
      // Transform order items based on user role
      const orderObj = order.toObject();
      if (req.user.role !== 'admin') {
        orderObj.items = orderObj.items.map(item => {
          if (item.product) {
            delete item.product.commission;
          }
          return item;
        });
      }
      
      res.json(orderObj);
    } else {
      console.log('Access denied - not admin or order owner');
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Error fetching order details');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching orders for user:', req.user._id);
    const orders = await Order.find({ user: req.user._id })
      .populate('user', 'name email')
      .populate('items.product', 'name image price sellerPrice')
      .sort('-createdAt');

    console.log('Found orders:', orders.length);
    
    // Transform orders to use sellerPrice for non-admin users
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      if (req.user.role !== 'admin') {
        orderObj.items = orderObj.items.map(item => {
          if (item.product) {
            delete item.product.commission;
          }
          return item;
        });
      }
      return orderObj;
    });
    
    res.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500);
    throw new Error('Error fetching orders: ' + error.message);
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = status;
  if (status === 'delivered') {
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name email')
      .populate('items.product', 'name image price sellerPrice seller commission')
      .sort({ createdAt: -1 });

    // Transform orders to include seller price for admin
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return orderObj;
    });

    res.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// @desc    Get orders by seller ID
// @route   GET /api/orders/seller/:sellerId
// @access  Private
const getOrdersBySellerId = asyncHandler(async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find orders where any item has sellerId matching the seller
    const totalOrders = await Order.countDocuments({
      'items.sellerId': sellerId
    });

    const orders = await Order.find({
      'items.sellerId': sellerId
    })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'items.product',
        select: 'name price sellerPrice seller image status'
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Transform orders to include only the seller's items and handle price display
    const transformedOrders = orders.map(order => {
      // Only include items for this seller
      const sellerItems = order.items.filter(item =>
        item.sellerId && item.sellerId.toString() === sellerId.toString()
      );
      if (sellerItems.length === 0) return null;
      
      // Transform items to use sellerPrice for non-admin users
      const transformedItems = sellerItems.map(item => {
        if (item.product && req.user.role !== 'admin') {
          delete item.product.commission;
        }
        return item;
      });
      
      const totalAmount = transformedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return {
        _id: order._id,
        user: order.user,
        items: transformedItems,
        totalAmount,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        paymentInfo: order.paymentInfo
      };
    }).filter(Boolean);

    res.json({
      orders: transformedOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch seller orders',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  testPaystackConnection,
  initializePayment,
  getAllOrders,
  getOrdersBySellerId
}; 