const { Schema, model } = require("mongoose");
const variantSchema = new Schema({
    sku: { type: String },
    color: { type: String },   // e.g., Black, White
    ha_style: {
        type: String
    },            // e.g.,BTE, RIC, CIC, IIC
    connectivity: { type: String },            // e.g., Wired, Bluetooth 5.2
    rechargeable: { type: String },             // e.g., "8 hours", "30 hours with case"
    batteryLife: { type: String },             // e.g., "8 hours", "30 hours with case"
    chargingType: { type: String },            // e.g., USB-C, Micro-USB, Wireless
    noiseCancellation: { type: String },       // e.g., ANC, ENC, Passive
    microphone: { type: String },             // true if it has a mic
    waterResistance: { type: String },         // e.g., IPX4, IP67
    compatibility: { type: [String] },         // e.g., ["iOS", "Android", "Windows"]
    weight: { type: String },                  // e.g., "50g"
    warranty: { type: String },                // e.g., "1 year"
    inBoxContents: { type: [String] },         // e.g., ["Charging Case", "Cable", "Ear Tips"]
    price: { type: Number },
    discountPrice: { type: Number },           // optional discount
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    images: [String]                           // array of image URLs for this variant
}, { _id: true });
const schema = new Schema({
    slug: {
        type: String
    },
    title: {
        type: String
    },
    product_type: {
        type: String,
        default: "gadget"
    },
    category: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }],
    short_description: {
        type: String
    },
    description: {
        type: String
    },
    variants: [variantSchema],
    brand: { type: String },
    tags: [String],
    isActive: { type: Boolean, default: true },

}, { timestamps: true });
module.exports = new model('Product', schema);