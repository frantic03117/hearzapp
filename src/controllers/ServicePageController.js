const ServicePage = require("../models/ServicePage");

const makeSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}


exports.createPage = async (req, res) => {
    try {
        const { title } = req.body;
        const slug = makeSlug(title);
        const data = { ...req.body };
        data['slug'] = slug;
        if (req.file) {
            data['banner'] = req.file.path
        }
        const resp = await ServicePage.create(data);
        return res.json({ success: 1, message: "Created successfully", data: resp });
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}

exports.getPages = async (req, res) => {
    try {
        const { type, slug } = req.query;
        let fdata = {};
        if (type) {
            fdata['type'] = type
        }
        if (slug) {
            fdata['slug'] = slug
        }
        const pages = await ServicePage.find(fdata);
        return res.json({ success: 1, data: pages });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
};

exports.addSection = async (req, res) => {
    try {
        const { id } = req.params;
        const page = await ServicePage.findById(id);
        if (!page) return res.status(404).json({ success: 0, message: "Page not found" });
        const section = {
            ...req.body,
            image: req.file ? req.file.path : null
        };
        page.sections.push(section);
        await page.save();

        return res.json({ success: 1, message: "Section added", data: page });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
};
// DELETE a section
exports.deleteSection = async (req, res) => {
    try {
        const { pageId, sectionId } = req.params;
        const page = await ServicePage.findById(pageId);
        if (!page) return res.status(404).json({ success: 0, message: "Page not found" });

        const section = page.sections.id(sectionId);
        if (!section) return res.status(404).json({ success: 0, message: "Section not found" });

        section.remove();
        await page.save();

        return res.json({ success: 1, message: "Section deleted", data: page });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
};
exports.getcategories = async (req, res) => {
    const result = await ServicePage.aggregate([
        {
            $match: { type: 'category' }
        },
        {
            $lookup: {
                from: 'servicepages',
                localField: '_id',
                foreignField: 'parent_id',
                as: 'children'
            }
        }
    ]);
    return res.json({ success: 1, data: result })
}
exports.deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const rsp = await ServicePage.findByIdAndDelete(id);

        if (!rsp) {
            return res.status(404).json({
                success: 0,
                message: "Page not found",
            });
        }

        return res.json({
            success: 1,
            message: "Page deleted successfully",
            data: rsp,
        });

    } catch (err) {
        return res.status(500).json({
            success: 0,
            message: err.message,
        });
    }
};




