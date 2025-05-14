const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const { protect } = require('../middleware/auth');
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  getAllUsers,
  deleteUser
} = require('../controllers/userController');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/', getAllUsers);
router.delete('/:id', protect, adminProtect, deleteUser);

module.exports = router; 