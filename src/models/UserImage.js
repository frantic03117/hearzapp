const { Schema, model } = require("mongoose");

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    image: {
        type: String
    }
});
module.exports = new model('UserImage', schema);