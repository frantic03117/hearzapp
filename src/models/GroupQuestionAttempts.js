const { Schema, model } = require("mongoose");

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: "Setting"
    },
    difficulty: {
        type: Schema.Types.ObjectId,
        ref: "Setting"
    },
}, { timestamps: true });


module.exports = new model('GroupQuestionAttempts', schema);