const Setting = require("../models/Setting")

exports.create_setting = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data['file'] = req.file.path
        }
        const resp = await Setting.create(data);
        return res.json({ success: 1, message: "Created successfully", data: resp })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
exports.get_setting = async (req, res) => {
    try {
        const { type, title, page = 1, perPage = 10 } = req.query;
        const fdata = {};
        if (type) {
            fdata['type'] = type;
        }
        if (title) {
            fdata['title'] = title;
        }
        const resp = await Setting.find(fdata);
        return res.json({ success: 1, message: "Fetched successfully", data: resp })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
exports.delete_setting = async (req, res) => {
    try {
        const resp = await Setting.deleteOne({ _id: req.params.id });
        return res.json({ success: 1, message: "deleted successfully", data: resp })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
exports.update_setting = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data['file'] = req.file.path
        }
        console.log(data);
        const resp = await Setting.findOneAndUpdate({ _id: req.params.id }, { $set: { ...data } }, { new: true });
        return res.json({ success: 1, message: "updated successfully", data: resp })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}