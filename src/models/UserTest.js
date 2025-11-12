const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    session_id: {
        type: String,
        unique: true,
        default: () => `TS-${uuidv4().split('-')[0].toUpperCase()}` //
    },
}, { timestamps: true });

module.exports = new model('UserTest', schema);