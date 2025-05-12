const { Schema, model } = require("mongoose");

const schema = new Schema({
    custom_order_id: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    clinic: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    cartids: [{
        type: Schema.Types.ObjectId,
        ref: "Cart"
    }],
    amount: {
        type: Number
    },
    delivery_charge: {
        type: Number
    },
    discount_type: {
        type: String,
        enum: ['Percent', 'Fixed'],
        default: null
    },
    discount: {
        type: Number
    },
    promo_code: {
        type: Schema.Types.Mixed,
        default: null
    },
    promo_discount: {
        type: Number
    },
    gateway_order_id: {
        type: String
    },
    gateway_request: {
        type: Schema.Types.Mixed,
        default: null
    },
    gateway_response: {
        type: Schema.Types.Mixed,
        default: null
    },
    payment_status: {
        type: String
    },
    delivery_address: {
        type: String
    },
}, { timestamps: true });
module.exports = new model('Order', schema);