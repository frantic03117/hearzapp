const { Schema, model } = require("mongoose");
const { randomUUID } = require('crypto');
const keyValueSchema = new Schema({
    key_name: {
        type: String,
        required: true,
        trim: true
    },
    key_value: {
        type: Schema.Types.Mixed,
        refPath: 'keys.refModel'
    },
    refModel: {
        type: String,
        required: false
    }
}, { _id: false });
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
    filters: [keyValueSchema]
}, { timestamps: true });

module.exports = new model('UserTest', schema);