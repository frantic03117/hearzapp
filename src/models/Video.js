const { Schema, model } = require("mongoose");

const schema = new Schema({
    url: {
        type: String
    },
    video: {
        type: String
    },
    source: {
        type: String,
    },
    specialization: [{
        type: Schema.Types.ObjectId,
        ref: "Specialization",
        default: null
    }],
    page_section: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    thumbnail: {
        type: String
    },
    banner: {
        type: String
    },
    is_deleted: {
        type: Boolean,
        default: false
    }


}, { timestamps: true });


module.exports = new model('Video', schema);