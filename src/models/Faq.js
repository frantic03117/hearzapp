const { default: mongoose, Schema, mongo } = require("mongoose");

const faqschema = new Schema({
    question: {
        type: String
    },
    answer: {
        type: String
    }
}, { timestamps: true })


const exportable = mongoose.model('faq', faqschema);
module.exports = exportable