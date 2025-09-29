const { Schema, model } = require("mongoose");

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        defult: null
    },
    question: {
        type: Schema.Types.ObjectId,
        ref: "SuggestionQuestion"
    },
    answer: {
        type: Schema.Types.Mixed,
    }
}, { timestamps: true });
module.exports = new model('SuggestionQuestionAttempt', schema);