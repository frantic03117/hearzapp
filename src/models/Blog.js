// Import dependencies
const mongoose = require("mongoose");

// Blog Schema with SEO Fields
const blogSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        default: null
    }],
    banner: { type: String },
    thumbnail: { type: String },
    slug: { type: String },
    content: { type: String, },
    metaDescription: { type: String },
    keywords: { type: [String] },
    createdAt: { type: Date, default: Date.now },
});


const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;