const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Product = require('../models/productModel');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Parse natural language query into structured filters
async function parseQuery(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that extracts product search parameters from natural language queries. Return only a JSON object with the following fields if mentioned: category, color, gender, maxPrice, minPrice. Use null for unspecified fields."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}

// Search products route
router.post('/search', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Parse the natural language query
    const filters = await parseQuery(prompt);

    // Build MongoDB query
    const query = {};
    
    if (filters.category) {
      query.category = { $regex: filters.category, $options: 'i' };
    }
    
    if (filters.color) {
      query.color = { $regex: filters.color, $options: 'i' };
    }
    
    if (filters.gender) {
      query.gender = filters.gender.toLowerCase();
    }
    
    if (filters.maxPrice || filters.minPrice) {
      query.price = {};
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      if (filters.minPrice) query.price.$gte = filters.minPrice;
    }

    // Find products matching the filters
    const products = await Product.find(query)
      .select('name price color gender category image description')
      .limit(20);

    res.json({
      filters,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Assistant search error:', error);
    res.status(500).json({ message: 'Error processing search request', error: error.message });
  }
});

module.exports = router; 