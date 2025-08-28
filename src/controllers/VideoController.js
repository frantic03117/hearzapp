const Specialization = require("../models/Specialization");
const Video = require("../models/Video");

const makeSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

exports.create_video = async (req, res) => {
    const { title } = req.body;
    const url = makeSlug(title);
    const data = { ...req.body };
    data['url'] = url;
    if (req.files.banner) {
        data['banner'] = req.files.banner[0].path;
    }
    if (req.files.thumbnail) {
        data['thumbnail'] = req.files.thumbnail[0].path;
    }
    if (req.files.video) {
        data['video'] = req.files.video[0].path;
        data['source'] = "local"
    }
    const resp = await Video.create(data);
    return res.json({ success: 1, message: "Data uploaded successfully", data: resp })

}
exports.get_video = async (req, res) => {
    const { page_name } = req.params;
    const { id, url, page = 1, perPage = 10, category } = req.query;
    const fdata = {};
    if (page_name) {
        fdata['page_section'] = page_name
    }
    if (id) {
        fdata['_id'] = id
    }
    if (category) {
        const categories = category.split(',').map(cat => cat.trim()).filter(Boolean);
        const regexQueries = categories.map(cat => ({
            title: { $regex: cat, $options: "i" }
        }));
        const foundspec = await Specialization.find({ $or: regexQueries });
        if (foundspec.length > 0) {
            fdata['specialization'] = { $in: foundspec.map(itm => itm._id) }
        } else {
            return res.json({ success: 1, message: "Not found", data: [] });
        }
    }
    const totalDocs = await Video.countDocuments(fdata);
    const skip = (page - 1) * perPage;
    const totalPages = Math.ceil(totalDocs / perPage);
    const pagination = {
        totalPages,
        perPage,
        page,
        totalDocs
    }
    const resp = await Video.find(fdata).populate({
        path: 'specialization',
        select: 'title '
    }).sort({ createdAt: -1 }).skip(skip).limit(perPage);
    return res.json({ success: 1, data: resp, message: "List of videos", pagination, fdata });

}
exports.delete_video = async (req, res) => {
    const { id } = req.params;
    const resp = await Video.deleteOne({ _id: id });
    return res.json({ success: 1, message: "Deleted successfully", data: resp });
}
exports.update_video = async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const url = makeSlug(title);
    const data = { ...req.body };
    data['url'] = url;
    if (req.files.banner) {
        data['banner'] = req.files.banner[0].path;
    }
    if (req.files.thumbnail) {
        data['thumbnail'] = req.files.thumbnail[0].path;
    }
    if (req.files.video) {
        data['thumbnail'] = req.files.video[0].path;
    }
    const resp = await Video.findOneAndUpdate({ _id: id }, { $set: data });
    return res.json({ success: 1, message: "Data uploaded successfully", data: resp })
}