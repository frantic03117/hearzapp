const { Schema, model } = require("mongoose");

const testAttemptSchema = new Schema({
    test_name: { // same as in TestQuestion
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
        type: Schema.Types.ObjectId // option id inside TestQuestion.options
    },
    answerText: {
        type: String // for written answers
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
