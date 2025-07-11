const { Schema, model } = require("mongoose");

const schema = new Schema({
    parent: {
        type: Schema.Types.ObjectId,
        ref: "Setting",
        default: null
    },
    slug: {
        type: String
    },
    title: {
        type: String
    },
    type: {
        type: String
    },
    media_value: {
        type: String
    },
    file: {
        type: String
    }
}, { timestamps: true });

module.exports = new model('Setting', schema);