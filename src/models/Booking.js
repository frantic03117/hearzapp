const { Schema, model } = require("mongoose");

const bookingSchema = new Schema({
    doctor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
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
    gateway_order_id: { type: String },
    gateway_request: {
        type: Schema.Types.Mixed,
        default: null
    },
    gateway_response: {
        type: Schema.Types.Mixed,
        default: null
    },
}, { timestamps: true });

module.exports = model('Booking', bookingSchema); // Removed "new"
