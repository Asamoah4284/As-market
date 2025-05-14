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
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Product category is required']
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

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 