const { Schema, default: mongoose } = require("mongoose");

const otpschema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    mobile: {
        type: String,
        match: [/^\d{10}$/, 'is invalid'],
        default: null
    },
    otp: {
        type: Number,
    },
    is_verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
module.exports = new mongoose.model('Otp', otpschema);