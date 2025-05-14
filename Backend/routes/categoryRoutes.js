const express = require('express');
const router = express.Router();
const Product = require('../models/productModel'); // Adjust path as needed

// Get all categories
router.get('/', async (req, res) => {
  try {
    // Define your categories structure (same as in your frontend)
    const categories = {
      PRODUCTS: {
        CLOTHING_FASHION: 'Clothing & Fashion',
        ELECTRONICS: 'Electronics & Gadgets',
        SCHOOL_SUPPLIES: 'School Supplies',
        FOOD_DRINKS: 'Food & Drinks',
        BEAUTY_SKINCARE: 'Beauty & Skincare',
        HEALTH_FITNESS: 'Health & Fitness',
        FURNITURE_HOME: 'Furniture & Home Items',
        EVENT_TICKETS: 'Event Tickets & Merchandise'
      },
      SERVICES: {
        HOSTEL_AGENTS: 'Hostel Agents',
        ASSIGNMENT_HELP: 'Assignment Assistance',
        GRAPHIC_DESIGN: 'Graphic Design',
        PHOTO_VIDEO: 'Photography & Videography',
        LAUNDRY: 'Laundry Services',
        BARBER_HAIR: 'Barbering & Hairdressing',
        MC_DJ: 'MCs & DJs for Events',
        TUTORING: 'Tutoring & Lessons',
        FREELANCE_WRITING: 'Freelance Writing',
        TECH_SUPPORT: 'Tech Support'
      }
    };
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category
router.get('/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { isService } = req.query;
    
    // Build query object
    const query = {};
    
    // Add category filter if provided and not 'all'
    if (categoryId && categoryId !== 'all') {
      query.category = categoryId;
    }
    
    // Add service/product filter if provided
    if (isService !== undefined) {
      query.isService = isService === 'true';
    }
    
    // Find products matching the query
    const products = await Product.find(query).populate('seller', 'name');
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;