const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const cartController = {
    // Add item to cart
    addToCart: async (req, res) => {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ 
                    message: 'User not authenticated' 
                });
            }

            const { productId, quantity } = req.body;
            const userId = req.user._id;

            // First, check if the product exists and has sufficient stock
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ 
                    message: 'Product not found' 
                });
            }

            // Check if requested quantity is available
            if (product.stock < quantity) {
                return res.status(400).json({ 
                    message: `Only ${product.stock} units available in stock` 
                });
            }

            // Check if product is already in cart
            let cartItem = await Cart.findOne({ user: userId, product: productId });

            if (cartItem) {
                // Check if adding more quantity would exceed available stock
                const newTotalQuantity = cartItem.quantity + quantity;
                if (product.stock < newTotalQuantity) {
                    return res.status(400).json({ 
                        message: `Cannot add ${quantity} more units. Only ${product.stock - cartItem.quantity} additional units available` 
                    });
                }
                
                cartItem.quantity = newTotalQuantity;
                await cartItem.save();
            } else {
                cartItem = await Cart.create({
                    product: productId,
                    quantity,
                    user: userId
                });
            }

            // Note: Stock is NOT decreased here - it will be decreased when order is completed
            // This prevents stock from being held indefinitely in carts
            // Stock validation is still performed to ensure users can't add more than available

            await cartItem.populate('product');
            const transformedItem = {
                _id: cartItem._id,
                productId: cartItem.product._id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                image: cartItem.product.images?.[0] || cartItem.product.image,
                quantity: cartItem.quantity,
                sellerId: cartItem.product.seller
            };

            res.status(200).json(transformedItem);
        } catch (error) {
            console.error('Add to cart error:', error);
            res.status(500).json({ 
                message: error.message || 'Error adding item to cart',
                details: error.toString()
            });
        }
    },

    // Get cart items
    getCartItems: async (req, res) => {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ 
                    message: 'User not authenticated' 
                });
            }

            const userId = req.user._id;
            console.log('Fetching cart items for user:', userId);

            const cartItems = await Cart.find({ user: userId }).populate('product');
            console.log('Found cart items:', cartItems);
            
            // Filter out any cart items with null products and transform the valid ones
            const transformedItems = cartItems
                .filter(item => item.product != null) // Remove items with null products
                .map(item => ({
                    _id: item._id,
                    productId: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    image: item.product.images?.[0] || item.product.image,
                    quantity: item.quantity,
                    sellerId: item.product.seller
                }));

            // Optionally clean up cart items with null products
            const nullProductItems = cartItems.filter(item => item.product == null);
            if (nullProductItems.length > 0) {
                console.log('Cleaning up cart items with null products:', nullProductItems.length);
                await Cart.deleteMany({
                    _id: { $in: nullProductItems.map(item => item._id) }
                });
            }

            res.status(200).json(transformedItems);
        } catch (error) {
            console.error('Cart controller error:', error);
            res.status(500).json({ 
                message: error.message || 'Error fetching cart items',
                details: error.toString()
            });
        }
    },

    // Update cart item quantity
    updateCartItem: async (req, res) => {
        try {
            const { quantity } = req.body;
            const cartItemId = req.params.id;
            
            // Find the cart item
            const cartItem = await Cart.findById(cartItemId).populate('product');
            if (!cartItem) {
                return res.status(404).json({ 
                    message: 'Cart item not found' 
                });
            }

            // Check if user owns this cart item
            if (cartItem.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    message: 'Not authorized to update this cart item' 
                });
            }

            const product = await Product.findById(cartItem.product._id);
            if (!product) {
                return res.status(404).json({ 
                    message: 'Product not found' 
                });
            }

            // Check if new quantity exceeds available stock
            if (product.stock < quantity) {
                return res.status(400).json({ 
                    message: `Only ${product.stock} units available in stock` 
                });
            }

            // Update cart item quantity (stock is not modified here)
            cartItem.quantity = quantity;
            await cartItem.save();

            // Transform response
            const transformedItem = {
                _id: cartItem._id,
                productId: cartItem.product._id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                image: cartItem.product.images?.[0] || cartItem.product.image,
                quantity: cartItem.quantity,
                sellerId: cartItem.product.seller
            };

            res.status(200).json(transformedItem);
        } catch (error) {
            console.error('Update cart item error:', error);
            res.status(500).json({ 
                message: error.message || 'Error updating cart item',
                details: error.toString()
            });
        }
    },

    // Remove item from cart
    removeFromCart: async (req, res) => {
        try {
            const cartItemId = req.params.id;
            
            // Find the cart item to verify it exists
            const cartItem = await Cart.findById(cartItemId);
            if (!cartItem) {
                return res.status(404).json({ 
                    message: 'Cart item not found' 
                });
            }

            // Check if user owns this cart item
            if (cartItem.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    message: 'Not authorized to remove this cart item' 
                });
            }

            // Remove the cart item (stock is not modified here)
            await Cart.findByIdAndDelete(cartItemId);
            
            res.status(200).json({ 
                message: 'Item removed from cart'
            });
        } catch (error) {
            console.error('Remove from cart error:', error);
            res.status(500).json({ 
                message: error.message || 'Error removing item from cart',
                details: error.toString()
            });
        }
    }
};

module.exports = cartController; 