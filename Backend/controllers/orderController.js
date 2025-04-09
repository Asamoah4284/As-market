const Order = require('../models/Order');
const Cart = require('../models/cartModel');
const https = require('https');
const asyncHandler = require('express-async-handler');

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
    console.log('Creating order with data:', req.body);
    console.log('User ID:', req.user._id);

    const { 
      paymentReference,
      items,
      totalAmount
    } = req.body;

    if (!items || items.length === 0) {
      console.error('No order items provided');
      res.status(400);
      throw new Error('No order items');
    }

    if (!paymentReference) {
      console.error('No payment reference provided');
      res.status(400);
      throw new Error('Payment reference is required');
    }

    // Verify payment with Paystack
    console.log('Verifying payment with reference:', paymentReference);
    const paymentVerification = await verifyPaystackPayment(paymentReference);
    console.log('Payment verification response:', paymentVerification);

    if (!paymentVerification.status) {
      res.status(400);
      throw new Error('Payment verification failed: Invalid response from Paystack');
    }

    if (paymentVerification.data?.status !== 'success') {
      res.status(400);
      throw new Error(`Payment verification failed: Transaction status is ${paymentVerification.data?.status}`);
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

    // Create order
    const orderData = {
      user: req.user._id,
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image
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
    const order = new Order(orderData);
    const createdOrder = await order.save();
    console.log('Order created successfully:', createdOrder._id);

    // Clear user's cart
    await Cart.deleteMany({ user: req.user._id });
    console.log('User cart cleared');

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(error.status || 400);
    throw new Error(error.message || 'Failed to create order');
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

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  testPaystackConnection,
  initializePayment
}; 