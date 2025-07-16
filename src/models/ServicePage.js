const { Schema, Model, model } = require("mongoose");
const SectionSchema = new Schema({
    image: String,
    description: String,
    isActive: {
        type: Boolean,
        default: true
    }
})
const schema = new Schema({
    type: String,
    title: String,
    slug: String,
    parent_id: {
        type: Schema.Types.ObjectId,
        ref: "ServicePage",
        default: null
    },
    banner: String,
    sections: [SectionSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
module.exports = new model('ServicePage', schema);