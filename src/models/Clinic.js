const { Schema, model } = require("mongoose");

const schema = new Schema({
    profile_image: {
        type: String
    },
    logo: {
        type: String
    },
    title: {
        type: String
    },
    email: {
        type: String
    },
    mobile: {
        type: String
    },
    address: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    pincode: {
        type: String
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: User,
        default: null
    }
}, { timestamps: true });

module.exports = new model('Clinic', schema);