const Category = require("../models/Category");

async function generateUniqueSlug(name, id = null) {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let count = 1;
    const fdata = {
        slug: slug
    }
    if (id) {
        fdata['_id'] = { $ne: id }
    }
    const alreadusers = await Category.find({ slug });
    // Check if the slug already exists
    count = alreadusers.length + 1;
    if (count > 1) {
        slug = `${slug}-${count}`;
    }


    return slug;
}

exports.create_category = async (req, res) => {
    const title = req.body.title;
    if (!title) {
        return res.status(500).json({ success: 0, message: "Title is required", data: null });
    }
    const slug = await generateUniqueSlug(title);
    const data = {
        title: title,
        slug: slug
    }
    if (req.file) {
        data['icon'] = req.file.path
    }
    const resp = await Category.create(data);
    return res.json({ success: 1, data: resp, message: "Category created successfully" });
}
exports.update_category = async (req, res) => {
    const { id } = req.params;
    const title = req.body.title;
    if (!title) {
        return res.status(500).json({ success: 0, message: "Title is required", data: null });
    }
    const slug = await generateUniqueSlug(title, id);
    const data = {
        title: title,
        slug: slug
    }
    if (req.file) {
        data['icon'] = req.file.path
    }
    const resp = await Category.findOneAndUpdate({ _id: id }, { $set: data });
    return res.json({ success: 1, data: resp, message: "Category created successfully" });
}
exports.get_categories = async (req, res) => {
    const resp = await Category.find().sort({ createdAt: -1 });
    return res.json({ success: 1, data: resp, 'message': "List of categories" });
}
exports.delete_categories = async (req, res) => {
    const { id } = req.params;
    const resp = await Category.deleteOne({ _id: id });
    return res.json({ success: 1, data: resp, 'message': "Deleted successfully" });
}