const { default: mongoose, Schema, mongo } = require("mongoose");

const schema = new Schema({
    title: {
        type: String,
        default: null

    },
    description: {
        type: String,
        default: null

    }, // message in case of contact form
    subject: {
        type: String,
        default: null

    },

    mobile: {
        type: String,
        default: null

    },
    email: {
        type: String,
        default: null

    },
    name: {
        type: String,
        default: null

    },
    type: {
        type: String,
        enum: ["Feedback", "ContactForm"],
        default: "Feedback"
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
}, { timestamps: true })

module.exports = new mongoose.model('Feedback', schema);