const { Schema, model } = require("mongoose");

const schema = new Schema({
    url: {
        type: String,
        unique: true
    },
    title: {
        type: String,
    },
    icon: {
        type: String
    }
});
module.exports = new model('Specialization', schema);