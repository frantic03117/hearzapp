const { default: axios } = require("axios");
const Setting = require("../models/Setting")
const makeSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
exports.create_setting = async (req, res) => {
    try {
        const data = { ...req.body };
        const media_value = req.body.media_value;
        const url = makeSlug(media_value);
        if (req.file) {
            data['file'] = req.file.path
        }
        data['slug'] = url;
        const resp = await Setting.create(data);
        return res.json({ success: 1, message: "Created successfully", data: resp })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
exports.get_setting = async (req, res) => {
    try {

        const { id, type, title, media_value, parent, page = 1, perPage = 10 } = req.query;
        const fdata = {};
        if (type) {
            fdata['type'] = { $in: type.split(',') };
        }
        if (id) {
            fdata['_id'] = id;
        }
        if (title) {
            fdata['title'] = title;
        }
        if (parent) {
            fdata['parent'] = parent;
        }
        if (media_value) {
            fdata['media_value'] = media_value;
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
        const media_value = req.body.media_value;
        if (req.file) {
            data['file'] = req.file.path
        }
        if (media_value) {
            const url = makeSlug(media_value);
            data['slug'] = url;
        }
        const resp = await Setting.findOneAndUpdate({ _id: req.params.id }, { $set: { ...data } }, { new: true });
        return res.json({ success: 1, message: "updated successfully", data: resp })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
exports.update_activation = async (req, res) => {
    try {
        const { id } = req.params;
        const findSetting = await Setting.findById(id);

        if (!findSetting) {
            return res.status(404).json({ success: 0, message: "Not found" });
        }

        findSetting.isActive = !findSetting.isActive;
        await findSetting.save();

        return res.json({
            success: 1,
            message: "Updated successfully",
            data: { id: findSetting._id, isActive: findSetting.isActive },
        });
    } catch (err) {
        return res.status(500).json({ success: 0, message: err.message });
    }
};
