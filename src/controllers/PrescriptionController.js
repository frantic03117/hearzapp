const Prescription = require("../models/Prescription");
const PrescriptionCategory = require("../models/PrescriptionCategory");
const User = require("../models/User");

const makeSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
exports.create_category = async (req, res) => {
    try {
        const data = { ...req.body };
        const title = req.body.title;
        data['slug'] = makeSlug(title);
        const resp = await PrescriptionCategory.create(data);
        return res.json({ success: 1, message: "PrescriptionCategory created successfull", data: resp });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
}
exports.update_category = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };
        const title = req.body.title;
        data['slug'] = makeSlug(title);
        const resp = await PrescriptionCategory.findOneAndUpdate({ _id: id }, { $set: data });
        return res.json({ success: 1, message: "PrescriptionCategory created successfull", data: resp });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
}
exports.delete_category = async (req, res) => {
    const { id } = req.params;
    const resp = await PrescriptionCategory.deleteOne({ _id: id });
    return res.json({ success: 1, message: "PrescriptionCategory deleted successfull", data: resp });
}
exports.get_category = async (req, res) => {
    const resp = await PrescriptionCategory.find();
    return res.json({ success: 1, message: "List of Category", data: resp });
}
exports.write_perscription = async (req, res) => {
    const { category, text, user } = req.body;
    const checkCategory = await PrescriptionCategory.findOne({ _id: category });
    if (!checkCategory) {
        return res.json({ success: 0, message: "Invalid cateogry" });
    }
    const findUser = await User.findOne({ _id: user });
    if (!findUser) {
        return res.json({ success: 0, message: "patient not found" });
    }
    const data = { category, user, text, doctor: req.user._id };
    const resp = await Prescription.create(data);
    return res.json({ success: 1, message: "Prescription created successfully", data: resp })
}
exports.delete_perscription = async (req, res) => {
    const { id } = req.params;
    const resp = await Prescription.deleteOne({ _id: id });
    return res.json({ success: 1, message: "Prescription deleted successfull", data: resp });
}
exports.update_perscription = async (req, res) => {
    const { category, text, user } = req.body;
    const { id } = req.params;
    const checkCategory = await PrescriptionCategory.findOne({ _id: category });
    if (!checkCategory) {
        return res.json({ success: 0, message: "Invalid cateogry" });
    }
    const findUser = await User.findOne({ _id: user });
    if (!findUser) {
        return res.json({ success: 0, message: "patient not found" });
    }
    const data = { category, user, text, doctor: req.user._id };
    const resp = await Prescription.findOneAndUpdate({ _id: id }, { $set: data });
    return res.json({ success: 1, message: "Prescription updated successfully", data: resp })
}
exports.get_perscription = async (req, res) => {
    try {
        const { user, doctor } = req.query;
        const userId = req.user._id;
        const role = req.user.role;
        const fdata = {};
        if (role == "User") {
            fdata['user'] = userId
        }
        if (role == "Doctor") {
            fdata['doctor'] = userId
        }
        if (user) {
            fdata['user'] = user
        }
        if (doctor) {
            fdata['doctor'] = doctor;
        }
        const resp = await Prescription.find(fdata).populate({
            path: 'doctor',
            select: 'custom_request_id name mobile gender dob address role profile_image'
        }).populate({
            path: "user",
            select: 'custom_request_id name mobile gender dob address role profile_image'
        })
        return res.json({ success: 1, message: "List of prescriptions", data: resp });
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}