const { Schema, model } = require("mongoose");

const schema = new Schema({
    form: String,
    label: String,
    key: String,
    type: String,
    order: {
        type: Number
    }
}, { timestamps: true });
module.exports = new model('VariantKey', schema);