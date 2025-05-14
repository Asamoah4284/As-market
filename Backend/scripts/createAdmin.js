require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

// Admin details - you can modify these
const adminData = {
  name: 'Asamoah Richard',
  email: 'richardasamoah284@gmail.com',
  password: 'Rockstar123@+', // You should use a strong password
  role: 'admin'
};

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminData.email });
    
    if (adminExists) {
      console.log('Admin user already exists');
      
      // If you want to update the existing admin instead:
      // adminExists.name = adminData.name;
      // await adminExists.save();
      // console.log('Admin user updated');
      
      process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    // Create admin user
    const admin = await User.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Admin user created successfully:');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`ID: ${admin._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin(); 