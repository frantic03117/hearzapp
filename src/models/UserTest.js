const { Schema, model } = require("mongoose");
const { randomUUID } = require('crypto');
const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    session_id: {
        type: String,
        unique: true,
        default: () => `TS-${randomUUID().split('-')[0].toUpperCase()}` //
    },
}, { timestamps: true });

module.exports = new model('UserTest', schema);