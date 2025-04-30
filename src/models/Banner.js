const { Schema, model } = require("mongoose");

const schema = new Schema({
    type: {
        type: String
    },
    image: {
        type: String
    }
}, { timestamps: true });

module.exports = new model('Banner', schema);