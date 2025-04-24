const { Schema, model } = require("mongoose");

const schema = new Schema({
    code: {
        type: String
    },
    short_description: {
        type: String
    },
    minimum_order: {
        type: Number
    },
    discount: {
        type: Number
    },
    discount_type: {
        type: String,
        enum: ['Percent', 'INR'],
        default: "Percent"
    },
    start_at: {
        type: Date
    },
    end_at: {
        type: Date
    },
    is_active: {
        type: String,
        enum: ['Active', 'Deactive'],
        default: "Active"
    }

}, { timestamps: true });
module.exports = new model('PromoCode', schema);