const VariantKey = require("../models/VariantKey");



exports.createKey = async (req, res) => {
    try {
        const { form, label, key, type } = req.body;

        const missingFields = [];
        if (!label) missingFields.push("label");
        if (!key) missingFields.push("key");
        if (!type) missingFields.push("type");

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required field(s): ${missingFields.join(", ")}`
            });
        }

        // Get max order and increment
        const lastKey = await VariantKey.findOne().sort("-order");
        const nextOrder = lastKey ? lastKey.order + 1 : 1;

        const variantKey = await VariantKey.create({ ...req.body, order: nextOrder });
        res.status(201).json(variantKey);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Key must be unique" });
        }
        res.status(500).json({ message: err.message });
    }
};

// UPDATE (same field-specific check)
exports.updateKey = async (req, res) => {
    try {
        const { label, key, type } = req.body;

        const missingFields = [];
        if (!label) missingFields.push("label");
        if (!key) missingFields.push("key");
        if (!type) missingFields.push("type");

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required field(s): ${missingFields.join(", ")}`
            });
        }

        const updated = await VariantKey.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "VariantKey not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// DELETE
exports.deleteKey = async (req, res) => {
    try {
        const deleted = await VariantKey.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "VariantKey not found" });
        }
        res.json({ message: "VariantKey deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getKeys = async (req, res) => {
    try {
        const { id, form, label, key } = req.query;
        let fdata = {};
        if (id) fdata['_id'] = id;
        if (form) fdata['form'] = form;
        if (label) fdata['label'] = label;
        if (key) fdata['key'] = key;
        const keys = await VariantKey.find(fdata).sort({ order: 1 })
        res.json(keys);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
