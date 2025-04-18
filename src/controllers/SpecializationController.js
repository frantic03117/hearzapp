const Specialization = require('../models/Specialization');

const makeSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

const _create_specialization = async (req, res) => {
    try {
        const { title } = req.body;
        const slug = makeSlug(title);

        const isExists = await Specialization.findOne({ url: slug });
        if (isExists) {
            return res.status(400).json({ success: 0, message: "Specialization already exists", data: null });
        }

        const data = {
            title,
            url: slug,
            icon: req.file ? req.file.path : null
        };

        const specialization = await Specialization.create(data);
        return res.status(201).json({ success: 1, message: "Specialization created successfully", data: specialization });

    } catch (error) {
        console.error("Error creating specialization:", error);
        return res.status(500).json({ success: 0, message: "Internal server error" });
    }
}

const _update_specialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const slug = makeSlug(title);

        const isExists = await Specialization.findOne({ url: slug, _id: { $ne: id } });
        if (isExists) {
            return res.status(400).json({ success: 0, message: "Specialization already exists", data: null });
        }

        const data = {
            title,
            url: slug,
            icon: req.file ? req.file.path : null
        };

        const specialization = await Specialization.findByIdAndUpdate(id, data, { new: true });
        if (!specialization) {
            return res.status(404).json({ success: 0, message: "Specialization not found" });
        }

        return res.status(200).json({ success: 1, message: "Specialization updated successfully", data: specialization });

    } catch (error) {
        console.error("Error updating specialization:", error);
        return res.status(500).json({ success: 0, message: "Internal server error" });
    }
}

const delete_specialization = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Specialization.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: 0, message: "Specialization not found" });
        }

        return res.status(200).json({ success: 1, message: "Deleted successfully" });

    } catch (error) {
        console.error("Error deleting specialization:", error);
        return res.status(500).json({ success: 0, message: "Internal server error" });
    }
}

const get_all_specialization = async (req, res) => {
    try {
        const { id, keyword } = req.query;
        const filter = {};

        if (keyword) {
            filter['$or'] = [
                { title: { $regex: keyword, $options: "i" } },
                { url: { $regex: keyword, $options: "i" } },
            ];
        }

        if (id) {
            filter['_id'] = id;
        }

        const specializations = await Specialization.find(filter).lean();
        return res.status(200).json({ success: 1, message: "List of specializations", data: specializations });

    } catch (error) {
        console.error("Error fetching specializations:", error);
        return res.status(500).json({ success: 0, message: "Internal server error" });
    }
}

module.exports = {
    _create_specialization,
    _update_specialization,
    delete_specialization,
    get_all_specialization
}
