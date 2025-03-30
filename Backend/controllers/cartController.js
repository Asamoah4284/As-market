const Cart = require('../models/cartModel');

const cartController = {
    // Add item to cart
    addToCart: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            const userId = req.user._id; // Assuming you have authentication middleware

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

            // Populate product details and transform response
            await cartItem.populate('product');
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

    // Get cart items
    getCartItems: async (req, res) => {
        try {
            const userId = req.user._id;
            const cartItems = await Cart.find({ user: userId }).populate('product');
            
            // Transform cart items to include all necessary product details
            const transformedItems = cartItems.map(item => ({
                _id: item._id,
                productId: item.product._id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.images?.[0] || item.product.image,
                quantity: item.quantity,
                // Add any other product fields you need
            }));

            res.status(200).json(transformedItems);
        } catch (error) {
            res.status(500).json({ message: error.message });
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