const { Schema, model } = require("mongoose");
const oschema = new Schema({
    option: String
})
const schema = new Schema({
    test_name: {
        type: Schema.Types.ObjectId,
        ref: "Setting"
    },
    test_for: {
        type: String,
        enum: ['All', 'Adult', 'Children'],
        default: 'All'
    },
    question: {
        type: String
    },
    option_key: {
        type: Schema.Types.ObjectId,
        ref: "VariantKey",
        default: null
    },
    options: [oschema],
}, { timestamps: true });
module.exports = new model('TestQuestion', schema);