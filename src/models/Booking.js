const { Schema, model } = require("mongoose");

const bookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    booking_date: {
        type: Date,
    },
    duration: {
        type: Number
    },
    mode: {
        type: String,
        enum: ['Home', 'Clinic', 'Online'],
        default: "Clinic"
    },
    clinic: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    language: {
        type: String
    },
    start_at: {
        type: Date,
    },
    end_at: {
        type: Date,
    },
    status: {
        type: String
    },
    address: {
        type: String,
    },
    gateway_order_id: { type: String },
    gateway_request: {
        type: Schema.Types.Mixed,
        default: null
    },
    gateway_response: {
        type: Schema.Types.Mixed,
        default: null
    },
    payment_status: {
        type: String,
        default: "Pending"
    }
}, { timestamps: true });

module.exports = model('Booking', bookingSchema); // Removed "new"
