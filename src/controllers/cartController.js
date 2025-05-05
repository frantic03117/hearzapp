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
            cartItem.is_ordered = "Pending";
            cartItem.unit_price = findproduct.variants.find(obj => obj._id == variantId)?.price ?? 100
        } else {
            cartItem = new Cart({
                product: productId,
                variant: variantId,
                quantity,
                is_ordered: "Pending",
                unit_price: findproduct.variants.find(obj => obj._id == variantId)?.price ?? 100,
                cart_status: "Cart",
                user: userId
            });
        }
        await cartItem.save();
        res.status(200).json({ data: cartItem, success: 1, message: "Add to cart successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCartItems = async (req, res) => {
    try {
        const userId = req.user._id;
        const cartItems = await Cart.find({ user: userId }).lean();
        const enrichedCartItems = await Promise.all(cartItems.map(async (item) => {
            const product = await Product.findById(item.product).lean();
            const variant = product.variants.find(v => v._id.toString() === item.variant.toString());
            return {
                ...item,
                product: {
                    ...product,
                    variants: [variant]
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
        const { id } = req.params;
        const { quantity } = req.body;
        if (quantity > 0) {
            const cartItem = await Cart.findOne({ _id: id });
            if (cartItem.is_ordered != "Pending") {
                return res.json({ success: 0, message: "Please enter valid cart id" });
            }
            if (!cartItem) return res.status(404).json({ message: "Cart item not found" });
            cartItem.quantity = quantity;
            cartItem.is_ordered = "Pending";
            await cartItem.save();
            return res.status(200).json({ data: cartItem, success: 1, message: "Cart updated" });
        } else {
            await Cart.deleteOne({ _id: id });
            return res.status(200).json({ data: null, success: 1, message: "Cart deleted" });
        }
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
