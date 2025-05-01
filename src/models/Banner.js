const { Schema, model } = require("mongoose");

const schema = new Schema({

    type: {
        type: String
    },
    order: {
        type: Number
    },
    image: {
        type: String
    },
    heading: {
        type: String
    },
    short_description: {
        type: String
    }
}, { timestamps: true });

module.exports = new model('Banner', schema);