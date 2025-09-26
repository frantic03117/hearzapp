const { Schema, model } = require("mongoose");
const optionSchema = new Schema({
    label: String,
    value: String
})
const schema = new Schema({
    step: Number,
    hasFollowup: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['Primary', 'Secondary']
    },
    question: {
        type: String
    },
    key: String,
    options: [
        optionSchema
    ],


}, { timestamps: true });

module.exports = new model('SuggestionQuestion', schema);