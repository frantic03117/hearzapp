const { Schema, model } = require("mongoose");

const PrescriptionCategorySchema = new Schema({
    slug: {
        type: String
    },
    title: {
        type: String
    },
    order: {
        type: Number
    }
}, { timestamps: true });

module.exports = new model('PrescriptionCategory', PrescriptionCategorySchema)