const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const User = require('../models/User');
const Order = require('../models/Order');
const { adminProtect } = require('../middleware/adminAuth');

// Get all products with pagination for admin
router.get('/products', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('seller', 'name email');
      
    const total = await Product.countDocuments();
    
    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product featured status
router.put('/products/:id/featured', adminProtect, async (req, res) => {
  try {
    const { featuredType, featuredRank, discountPercentage, onSale } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update featured fields
    if (featuredType !== undefined) product.featuredType = featuredType;
    if (featuredRank !== undefined) product.featuredRank = featuredRank;
    if (discountPercentage !== undefined) product.discountPercentage = discountPercentage;
    if (onSale !== undefined) product.onSale = onSale;
    
    const updatedProduct = await product.save();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product featured status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Batch update featured products
router.post('/products/featured/batch', adminProtect, async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Invalid updates data' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { productId, featuredType, featuredRank } = update;
      
      if (!productId) continue;
      
      const product = await Product.findById(productId);
      
      if (!product) {
        results.push({ productId, success: false, message: 'Product not found' });
        continue;
      }
      
      if (featuredType !== undefined) product.featuredType = featuredType;
      if (featuredRank !== undefined) product.featuredRank = featuredRank;
      
      await product.save();
      results.push({ productId, success: true });
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error batch updating featured products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard statistics
router.get('/dashboard', adminProtect, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get active users (users who have placed orders in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastOrderDate: { $gte: thirtyDaysAgo }
    });

    // Get total orders and calculate commission revenue
    const orders = await Order.find({}).populate('items.product');
    const totalOrders = orders.length;
    
    // Calculate total commission revenue from all orders
    const revenue = orders.reduce((sum, order) => {
      const orderCommission = order.items.reduce((orderSum, item) => {
        // If the product exists and has a commission, add it
        if (item.product && item.product.commission) {
          return orderSum + (item.product.commission * item.quantity);
        }
        return orderSum;
      }, 0);
      return sum + orderCommission;
    }, 0);

    // Get monthly trends (last 5 months)
    const monthlyData = [];
    for (let i = 4; i >= 0; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      // Get users who registered this month
      const monthlyUsers = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Get orders and calculate commission revenue for this month
      const monthlyOrders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('items.product');
      
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => {
        const orderCommission = order.items.reduce((orderSum, item) => {
          if (item.product && item.product.commission) {
            return orderSum + (item.product.commission * item.quantity);
          }
          return orderSum;
        }, 0);
        return sum + orderCommission;
      }, 0);

      monthlyData.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        users: monthlyUsers,
        orders: monthlyOrders.length,
        revenue: monthlyRevenue
      });
    }

    // Calculate active user rate
    const activeUserRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalOrders,
        revenue
      },
      trends: {
        userGrowth: monthlyData.map(data => data.users),
        orderTrends: monthlyData.map(data => data.orders),
        revenueTrends: monthlyData.map(data => data.revenue),
        activeUserRate: parseFloat(activeUserRate.toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 