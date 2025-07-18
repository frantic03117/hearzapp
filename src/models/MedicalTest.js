const { Schema, model } = require("mongoose");
const EarSchema = new Schema({
    frequency: Number,
    decibal: Number
})
const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    for_self: {
        type: String,
        enum: ['Yes', 'No'],
        default: "Yes"
    },
    patient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    left_ear: {
        type: [EarSchema],
        default: []
    },
    right_ear: {
        type: [EarSchema],
        default: []
    },
    status: {
        type: String,
        default: "Pending"
    }
}, { timestamps: true });
module.exports = new model('MedicalTest', schema);