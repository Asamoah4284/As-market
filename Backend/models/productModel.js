const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    sellerPrice: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Product price with commission is required'],
      min: [0, 'Price cannot be negative']
    },
    commission: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative']
    },
    color: {
      type: String,
      required: function() {
        return !this.isService; // Only required for products, not services
      },
      trim: true
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      required: function() {
        return !this.isService; // Only required for products, not services
      }
    },
    category: {
      type: String,
      required: [false, 'Product category is required']
    },
    mainCategory: {
      type: String,
      required: true // This will be set by sellers, not required initially for backward compatibility
    },
    categoryId: {
      type: String,
      required: false,
      enum: ['1', '2', '3', '4', '5', '6'], // Electronic, Fashion, Home, Beauty, Sneakers, Books
      default: function() {
        if (this.category) {
          const categoryMap = {
            'Electronic': '1',
            'Fashion': '2', 
            'Home': '3',
            'Beauty': '4',
            'Sneakers': '5',
            'Books': '6'
          };
          return categoryMap[this.category] || '1';
        }
        return '1';
      }
    },
    subcategory: {
      type: String,
      default: null
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 1
    },
    image: {
      type: String,
      required: [true, 'Main product image is required']
    },
    additionalImages: {
      type: [String],
      default: []
    },
    isService: {
      type: Boolean,
      default: false
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller information is required']
    },
    sales: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    featuredType: {
      type: String,
      enum: [
        'new-arrivals',
        'featured',
        'featured-service',
        'trending',
        'special-offers',
        'new-season',
        'premium',
        'men',
        'women',
        'watches',
        null
      ],
      default: null
    },
    featuredRank: {
      type: Number,
      default: 999
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    onSale: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: null
    },
    views: {
      type: Number,
      default: 0
    },
    // Food service specific fields
    foodName: {
      type: String,
      trim: true
    },
    preparationTime: {
      type: String,
      trim: true
    },
    operatingHours: {
      type: String,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for comments
productSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'product'
});

// Virtual for category name based on categoryId
productSchema.virtual('categoryName').get(function() {
  const categories = {
    '1': 'Electronic',
    '2': 'Fashion', 
    '3': 'Home',
    '4': 'Beauty',
    '5': 'Sneakers',
    '6': 'Books'
  };
  return categories[this.categoryId] || 'Unknown';
});

// Static method to get all valid categories
productSchema.statics.getCategories = function() {
  return [
    { id: '1', name: 'Electronic', icon: 'devices', color: '#FF6B6B' },
    { id: '2', name: 'Fashion', icon: 'checkroom', color: '#4ECDC4' },
    { id: '3', name: 'Home', icon: 'home', color: '#FFD166' },
    { id: '4', name: 'Beauty', icon: 'spa', color: '#FF9F9F' },
    { id: '5', name: 'Sneakers', icon: 'sports-basketball', color: '#6A0572' },
    { id: '6', name: 'Books', icon: 'menu-book', color: '#1A535C' },
  ];
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 
module.exports = Product; 