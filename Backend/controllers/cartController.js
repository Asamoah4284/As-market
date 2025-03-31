const Cart = require('../models/cartModel');

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

            let cartItem = await Cart.findOne({ user: userId, product: productId });

            if (cartItem) {
                cartItem.quantity += quantity;
                await cartItem.save();
            } else {
                cartItem = await Cart.create({
                    product: productId,
                    quantity,
                    user: userId
                });
            }

            await cartItem.populate('product');
            const transformedItem = {
                _id: cartItem._id,
                productId: cartItem.product._id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                image: cartItem.product.images?.[0] || cartItem.product.image,
                quantity: cartItem.quantity,
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
            const cartItem = await Cart.findByIdAndUpdate(
                req.params.id,
                { quantity },
                { new: true }
            ).populate('product');

            // Transform response
            const transformedItem = {
                _id: cartItem._id,
                productId: cartItem.product._id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                image: cartItem.product.images?.[0] || cartItem.product.image,
                quantity: cartItem.quantity,
                // Add any other product fields you need
            };

            res.status(200).json(transformedItem);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Remove item from cart
    removeFromCart: async (req, res) => {
        try {
            await Cart.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Item removed from cart' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = cartController; 