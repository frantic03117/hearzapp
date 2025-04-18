const { Schema, model } = require("mongoose");

const schema = new Schema({
    slug: {
        type: String
    },
    order: {
        type: Number
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    title: {
        type: String
    },
    icon: {
        type: String
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
module.exports = new model('Category', schema);