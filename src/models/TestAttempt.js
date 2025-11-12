const { Schema, model } = require("mongoose");

const testAttemptSchema = new Schema({
    test_name: {
        type: Schema.Types.ObjectId,
        ref: "Setting",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    question: {
        type: Schema.Types.ObjectId,
        ref: "TestQuestion",
        required: true
    },
    selectedOption: {
        type: Schema.Types.ObjectId
    },
    answerText: {
        type: String
    },
    isCorrect: {
        type: Boolean,
        default: null
    },
    score: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = model("TestAttempt", testAttemptSchema);
