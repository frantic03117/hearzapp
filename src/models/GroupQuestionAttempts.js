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
    group: {
        type: Schema.Types.ObjectId,
        ref: "Setting",
        default: null
    },
    difficulty: {
        type: Schema.Types.ObjectId,
        ref: "Setting",
        default: null
    },
}, { timestamps: true });


module.exports = new model('GroupQuestionAttempts', schema);