const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const commentRoutes = require('./routes/commentRoutes');
const cartRoutes = require('./routes/cartRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Basic Route for the root
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Routes
app.use('y', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api', commentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/store-promotions', promotionRoutes);
app.use('/api/banners', bannerRoutes);

app.get('/api/test', async (req, res) => {
  try {
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await TestModel.create({ name: 'test document' });
    res.send('Test document created');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
