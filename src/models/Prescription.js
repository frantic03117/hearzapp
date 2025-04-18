const { Schema, model } = require("mongoose");

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "PrescriptionCategory"
    },
    text: {
        type: String
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

}, { timestamps: true });
module.exports = new model('Prescription', schema);