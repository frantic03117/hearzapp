const { Schema, model } = require("mongoose");

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    file: {
        type: String
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = new model('UserOfflinePrescription', schema);