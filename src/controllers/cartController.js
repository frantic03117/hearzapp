const Cart = require('../models/Cart');
const Product = require('../models/Product');
// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity = 1 } = req.body;
        const userId = req.user._id;
        const findproduct = await Product.findById(productId);
        if (!findproduct) return res.status(404).json({ message: "Product not found" });
        const variant = findproduct.variants.id(variantId);
        if (!variant) return res.status(404).json({ message: "Variant not found" });
        let cartItem = await Cart.findOne({ product: productId, variant: variantId, user: userId, cart_status: "Cart" });
        if (cartItem) {
            cartItem.quantity += quantity;
        } else {
            cartItem = new Cart({
                product: productId,
                variant: variantId,
                quantity,
                cart_status: "Cart",
                user: userId
            });
        }
        await cartItem.save();
        res.status(200).json(cartItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCartItems = async (req, res) => {
    try {
        const userId = req.user._id;
        const cartItems = await Cart.find({ user: userId }).lean(); // use .lean() for easier object manipulation

        // Fetch and attach exact variant info
        const enrichedCartItems = await Promise.all(cartItems.map(async (item) => {
            const product = await Product.findById(item.product).lean();
            const variant = product.variants.find(v => v._id.toString() === item.variant.toString());

            return {
                ...item,
                product: {
                    ...product,
                    variants: [variant] // include only the matched variant
                }
            };
        }));

        res.status(200).json({ data: enrichedCartItems, success: 1, message: "List of cart items" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Update quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;

        const cartItem = await Cart.findById(cartItemId);
        if (!cartItem) return res.status(404).json({ message: "Cart item not found" });

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json(cartItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        await Cart.findByIdAndDelete(cartItemId);
        res.status(200).json({ message: "Item removed from cart" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
