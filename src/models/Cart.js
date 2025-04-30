const { Schema, model } = require("mongoose");

const cartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
    },
    variant: {
        type: Schema.Types.ObjectId
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    unit_price: {
        type: Number
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    cart_status: {
        type: String,
        enum: ['Cart', 'Order', 'Wishlist'],
        default: "Cart"
    },
    is_ordered: {
        type: String,
        enum: ['Pending', 'Ordered', 'Cancelled'],
        default: "Pending"
    }
}, { timestamps: true });

module.exports = model('Cart', cartItemSchema);
