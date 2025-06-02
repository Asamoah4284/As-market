const crypto = require('crypto');
const Transaction = require('../models/transactionModel');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const https = require('https');

// Validate Paystack signature
const validatePaystackSignature = (req) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return hash === req.headers['x-paystack-signature'];
};

// Verify Paystack payment with improved security
const verifyPaystackPayment = async (reference) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
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
          
          // Validate response structure
          if (!response.status || !response.data) {
            return reject(new Error('Invalid response from Paystack'));
          }

          // Additional validation of payment data
          const paymentData = response.data;
          if (!paymentData.reference || !paymentData.amount || !paymentData.status) {
            return reject(new Error('Missing required payment data'));
          }

          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse Paystack response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Paystack verification request failed: ${error.message}`));
    });

    // Set timeout
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Paystack verification request timed out'));
    });

    req.end();
  });
};

// Handle Paystack webhook
const handlePaystackWebhook = asyncHandler(async (req, res) => {
  // Validate webhook signature
  if (!validatePaystackSignature(req)) {
    console.error('Invalid Paystack webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  // Log webhook event
  console.log('Paystack webhook received:', {
    event: event.event,
    reference: event.data?.reference,
    status: event.data?.status
  });

  try {
    // Find transaction by reference
    const transaction = await Transaction.findOne({
      paymentProviderReference: event.data.reference
    });

    if (!transaction) {
      console.error('Transaction not found for reference:', event.data.reference);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction based on event type
    switch (event.event) {
      case 'charge.success':
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.paymentProviderResponse = event.data;
        await transaction.save();

        // Update order status
        await Order.findByIdAndUpdate(transaction.order, {
          'paymentInfo.status': 'success',
          'paymentInfo.paidAt': new Date(),
          orderStatus: 'processing'
        });
        break;

      case 'charge.failed':
        transaction.status = 'failed';
        transaction.failureReason = event.data.gateway_response;
        transaction.paymentProviderResponse = event.data;
        await transaction.save();

        // Update order status
        await Order.findByIdAndUpdate(transaction.order, {
          'paymentInfo.status': 'failed',
          orderStatus: 'payment_failed'
        });
        break;

      case 'refund.processed':
        transaction.status = 'refunded';
        transaction.refundedAt = new Date();
        transaction.paymentProviderResponse = event.data;
        await transaction.save();

        // Update order status
        await Order.findByIdAndUpdate(transaction.order, {
          'paymentInfo.status': 'refunded',
          orderStatus: 'refunded'
        });
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Initialize payment with improved security
const initializePayment = asyncHandler(async (req, res) => {
  const { amount, email, orderId } = req.body;

  // Validate required fields
  if (!amount || !email || !orderId) {
    return res.status(400).json({
      error: 'Amount, email, and orderId are required'
    });
  }

  // Validate amount
  const amountInPesewas = Math.round(amount * 100);
  if (isNaN(amountInPesewas) || amountInPesewas <= 0) {
    return res.status(400).json({
      error: 'Invalid amount'
    });
  }

  try {
    // Create transaction record
    const transaction = await Transaction.create({
      order: orderId,
      user: req.user._id,
      amount: amount,
      paymentMethod: 'online',
      status: 'pending',
      paymentReference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Initialize Paystack payment
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const paystackReq = https.request(options, paystackRes => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', async () => {
        try {
          const response = JSON.parse(data);
          
          if (!response.status) {
            throw new Error(response.message || 'Payment initialization failed');
          }

          // Update transaction with Paystack reference
          transaction.paymentProviderReference = response.data.reference;
          await transaction.save();

          res.json({
            ...response.data,
            transactionId: transaction._id
          });
        } catch (error) {
          console.error('Error processing Paystack response:', error);
          res.status(500).json({
            error: 'Failed to initialize payment',
            details: error.message
          });
        }
      });
    });

    paystackReq.on('error', async (error) => {
      // Update transaction status on error
      transaction.status = 'failed';
      transaction.failureReason = error.message;
      await transaction.save();

      res.status(500).json({
        error: 'Payment initialization failed',
        details: error.message
      });
    });

    const paymentData = JSON.stringify({
      email,
      amount: amountInPesewas,
      currency: 'GHS',
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        transactionId: transaction._id.toString(),
        orderId: orderId,
        userId: req.user._id.toString()
      }
    });

    paystackReq.write(paymentData);
    paystackReq.end();
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      error: 'Failed to initialize payment',
      details: error.message
    });
  }
});

module.exports = {
  handlePaystackWebhook,
  initializePayment,
  verifyPaystackPayment
}; 