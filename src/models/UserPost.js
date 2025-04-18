const { Schema, model } = require("mongoose");

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
    },
    files: {
        type: [String]
    },
    voices: {
        type: [String]
    }

}, { timestamps: true });

module.exports = new model('UserPost', schema);