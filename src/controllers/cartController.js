const Cart = require('../models/Cart');
const Product = require('../models/Product');
// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity = 1, cart_status = "Cart" } = req.body;
        const userId = req.user._id;

        const findproduct = await Product.findById(productId);
        if (!findproduct) return res.status(404).json({ message: "Product not found" });
        const variant = findproduct.variants.id(variantId);
        if (!variant) return res.status(404).json({ message: "Variant not found" });
        let cartItem = await Cart.findOne({ product: productId, variant: variantId, user: userId, cart_status: cart_status });
        if (cartItem) {
            if (cart_status == "Wishlist") {
                await Cart.deleteOne({ _id: cartItem._id });
                return res.json({ success: 1, message: "Wishlist removed successfully", data: null });
            }
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
                cart_status: req.body.cart_status ?? "Cart",
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
        const { page = 1, perPage = 10, cart_status, user, is_ordered } = req.body;
        const fdata = {}
        if (req.user.role == "User") {
            fdata['user'] = req.user._id
        }
        if (cart_status) {
            fdata['cart_status'] = cart_status
        }
        if (user) {
            fdata['user'] = user
        }
        if (is_ordered) {
            fdata['is_ordered'] = is_ordered
        }
        const skip = (page - 1) * perPage;
        const totalDocs = await Cart.countDocuments(fdata);
        const totalPages = Math.ceil(totalDocs / perPage);
        const pagination = { page, totalDocs, totalPages, perPage };
        const cartItems = await Cart.find(fdata).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean();
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
        res.status(200).json({ data: enrichedCartItems, pagination, success: 1, message: "List of items" });
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
