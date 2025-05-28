const Cart = require("../models/Cart");
const Order = require("../models/Order");
const PromoCode = require("../models/PromoCode");

exports.create_order = async (req, res) => {
    try {
        const user_id = req.user._id;
        const fdata = {
            is_ordered: "Pending",
            user: user_id
        }
        const carts = await Cart.find(fdata);
        const totalAmount = carts.reduce((sum, cart) => sum + (cart.unit_price * cart.quantity), 0);

        const order_data = {
            custom_order_id: "SOFTHEAR" + new Date().getTime(),
            amount: totalAmount,
            cartids: carts.map(itm => itm._id),
            user: user_id
        }
        //return res.json({ order_data, carts })
        const orderesp = await Order.create(order_data);
        return res.json({ data: orderesp, success: 1, message: "Order created successfully", })

    } catch (err) {
        const stackLine = err.stack?.split("\n")[1]?.trim();
        return res.json({ success: 0, message: err.message, stackLine })
    }
}
exports.apply_promocode = async (req, res) => {
    try {
        const user = req.user._id;
        const { promo_code, order_id } = req.body;
        const findorder = await Order.findOne({ _id: order_id, user: user });
        const findPromoCode = await PromoCode.findOne({ code: promo_code });
        if (!findorder) {
            return res.json({ success: 0, message: 'Order not found', data: null })
        }
        if (!findPromoCode) {
            return res.json({ sucess: 0, message: "Invalid promo code", data: null });
        }
        // Check if promo code is active
        if (findPromoCode.is_active !== "Active") {
            return res.json({ success: 0, message: "Promo code is not active", data: null });
        }
        const now = new Date();
        // if (findPromoCode.start_at && findPromoCode.start_at > now) {
        //     return res.json({ success: 0, message: "Promo code is not yet valid", data: null });
        // }
        if (findPromoCode.end_at && findPromoCode.end_at < now) {
            return res.json({ success: 0, message: "Promo code has expired", data: null });
        }

        // Check minimum order amount
        if (findPromoCode.minimum_order && findorder.total < findPromoCode.minimum_order) {
            return res.json({ success: 0, message: `Minimum order value should be ₹${findPromoCode.minimum_order}`, data: null });
        }
        // Calculate discount
        let discountAmount = 0;
        if (findPromoCode.discount_type === "Percent") {
            discountAmount = (findorder.amount * findPromoCode.discount) / 100;
        } else {
            discountAmount = findPromoCode.discount;
        }
        const odata = {
            promo_code: findPromoCode,
            promo_discount: discountAmount
        }
        const resp = await Order.findOneAndUpdate({ _id: findorder._id }, { $set: odata }, { new: true });
        return res.json({ success: 1, message: "Promocode applied", data: resp })

    } catch (err) {
        const stackLine = err.stack?.split("\n")[1]?.trim();
        return res.json({ success: 0, message: err.message, stackLine })
    }
}
exports.get_orders = async (req, res) => {
    try {
        const { page = 1, perPage = 10, id, slug } = req.query;
        const fdata = {};
        if (id) {
            fdata['_id'] = id;
        }
        if (req.user.role == "User") {
            fdata['user'] = req.user._id
        }
        const totalDocs = await Order.countDocuments(fdata);
        const totalPages = Math.ceil(totalDocs / perPage);
        const skip = (page - 1) * perPage;
        const pagination = {
            page, perPage, totalPages, totalDocs
        }
        const orders = await Order.find(fdata)
            .populate({
                path: "cartids",
                populate: {
                    path: "product"
                }
            }).populate({
                path: "user",
                select: "name email mobile profile_image"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        // Post-process to extract matching variant manually
        const processedOrders = orders.map(order => {
            const cartItems = order.cartids.map(cart => {
                const product = cart.product;
                const variant = product?.variants?.find(v => v._id.toString() === cart.variant.toString());

                return {
                    ...cart.toObject(),
                    product,
                    variant
                };
            });

            return {
                ...order.toObject(),
                cartids: cartItems
            };
        });

        return res.json({ success: 1, message: "List of orders", data: processedOrders, pagination });

    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}