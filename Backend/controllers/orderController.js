const Order = require('../models/Order');
const Cart = require('../models/cartModel');
const https = require('https');
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

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
      totalAmount
    } = req.body;

    // Check for either orderItems or items property
    const items = orderItems || req.body.items;

    // Log item presence and format
    console.log('orderItems property exists:', !!orderItems);
    console.log('items property exists:', !!req.body.items);
    console.log('Final items to use:', items ? `${items.length} items` : 'undefined');

    if (!items || items.length === 0) {
      console.error('No order items provided in request:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!paymentReference) {
      console.error('No payment reference provided');
      return res.status(400).json({ message: 'Payment reference is required' });
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

    // Create order
    const orderData = {
      user: req.user._id,
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
        sellerId: item.sellerId
      })),
      paymentInfo: {
        reference: paymentReference,
        status: 'success',
        amount: totalAmount,
        currency: 'GHS',
        paidAt: Date.now()
      },
      totalAmount,
      orderStatus: 'processing'
    };

    console.log('Creating order with data:', orderData);
    try {
      const order = new Order(orderData);
      const createdOrder = await order.save();
      console.log('Order created successfully:', createdOrder._id);
      
      // Update stock for each product in the order
      for (const item of items) {
        try {
          // Log the entire item to see its structure
          console.log('Processing order item:', item);
          
          // Get the product ID - handle both _id and productId cases
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
          } else {
            console.log(`Product ${product._id} is a service, skipping stock update`);
          }
        } catch (itemError) {
          console.error(`Error updating stock for item:`, itemError);
          // Continue with other products even if one fails
          continue;
        }
      }

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
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name image');

  if (order && (order.user._id.toString() === req.user._id.toString())) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
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
      .populate('items.product', 'name image price')
      .sort('-createdAt');

    console.log('Found orders:', orders.length);
    res.json(orders);
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
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// @desc    Get orders by seller ID
// @route   GET /api/orders/:sellerId
// @access  Private
const getOrdersBySellerId = asyncHandler(async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    console.log('Fetching orders for seller:', sellerId);

    // First, find all products belonging to the seller
    const sellerProducts = await Product.find({ seller: sellerId });
    console.log('Found seller products:', sellerProducts.length);

    if (!sellerProducts.length) {
      console.log('No products found for seller');
      return res.json([]);
    }

    const productIds = sellerProducts.map(product => product._id);
    console.log('Product IDs to search for:', productIds);

    // Find orders containing any of the seller's products
    const orders = await Order.find({
      'items': {
        $elemMatch: {
          'product': { $in: productIds }
        }
      }
    })
    .populate({
      path: 'user',
      select: 'name email phone'
    })
    .populate({
      path: 'items.product',
      select: 'name price seller'
    })
    .sort('-createdAt');

    console.log('Found orders:', orders.length);

    // Transform orders to include only the seller's products
    const transformedOrders = orders.map(order => {
      // Filter items to only include products from this seller
      const sellerItems = order.items.filter(item => 
        item.product && 
        item.product.seller && 
        item.product.seller.toString() === sellerId.toString()
      );

      if (sellerItems.length === 0) return null;

      // Calculate total amount for seller's items
      const totalAmount = sellerItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      return {
        _id: order._id,
        user: order.user,
        items: sellerItems,
        totalAmount,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress
      };
    }).filter(Boolean); // Remove any null orders

    console.log('Transformed orders:', transformedOrders.length);
    res.json(transformedOrders);
  } catch (error) {
    console.error('Error in getOrdersBySellerId:', error);
    res.status(500);
    throw new Error('Failed to fetch seller orders: ' + error.message);
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