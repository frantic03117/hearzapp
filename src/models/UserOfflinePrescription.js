const { Schema, model } = require("mongoose");

const schema = new Schema({
    session_id: {
        type: Schema.Types.ObjectId,
        ref: "UserTest",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    file: {
        type: String
    },
    description: {
        type: String
    },
    hl_degree: {
        type: Number
    }
}, { timestamps: true });

module.exports = new model('UserOfflinePrescription', schema);