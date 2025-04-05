const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: function() { return !this.phone; }, 
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        // Only validate if email is provided
        if (!v) return true;
        // Simple email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  phone: {
    type: String,
    required: function() { return !this.email; },
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        // Only validate if phone is provided
        if (!v) return true;
        // Simple phone validation regex (adjust as needed)
        return /^\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['buyer', 'seller', 'admin'], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add a pre-save hook to ensure either email or phone is provided
userSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    return next(new Error('Either email or phone is required'));
  }
  next();
});

// Replace the direct model export with this check
module.exports = mongoose.models.User || mongoose.model('User', userSchema);

// Instead of just:
// module.exports = mongoose.model('User', userSchema); 