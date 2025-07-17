const { default: mongoose } = require("mongoose");
const DoctorSpecialization = require("../models/DoctorSpecialization");
const User = require("../models/User");
const Specialization = require("../models/Specialization");

exports.handle_specility = async (req, res) => {
    const { doctor_id } = req.params;
    const isDoctorExists = await User.findOne({ role: 'Doctor', _id: doctor_id });
    if (!isDoctorExists) {
        return res.json({ success: 0, message: "Invalid therapiest", data: [] });
    }
    const { spcility_id } = req.body;
    const isExists = await DoctorSpecialization.findOne({ doctor: doctor_id, specialization: spcility_id });
    if (isExists) {
        await DoctorSpecialization.findOneAndUpdate({ _id: isExists._id }, { $set: { is_active: !isExists.is_active } });
        return res.json({ success: 1, message: `Specility ${isExists.is_active ? 'activated' : 'deactivted'} successfully` });
    } else {
        await DoctorSpecialization.create({ doctor: doctor_id, specialization: spcility_id });
        return res.json({ success: 1, message: "Specility Activated successfully" });
    }

}
exports.get_specility = async (req, res) => {
    const { doctor_id } = req.params;
    const isDoctorExists = await User.findOne({ role: 'Doctor', _id: doctor_id });
    if (!isDoctorExists) {
        return res.json({ success: 0, message: "Invalid therapiest", data: [] });
    }
    const resps = await DoctorSpecialization.find({ doctor: doctor_id, is_active: true });
    return res.json({ success: 1, message: "List of specilities", data: resps });
}
exports.getDoctorWithSpecialization = async (req, res) => {
    const { url, id, clinic, category, clinic_slug, languages = [], specility = [], mode = [], page = 1, perPage = 10 } = req.query;

    try {
        const languagesArr = Array.isArray(languages) ? languages : languages.split(',').filter(Boolean);
        const specilityArr = Array.isArray(specility) ? specility : specility.split(',').filter(Boolean);
        const modeArr = Array.isArray(mode) ? mode : mode.split(',').filter(Boolean);

        const fdata = {
            "role": "Doctor",
        }
        if (req.user) {
            if (req.user.role == "User") {
                fdata['is_verified'] = true;
            }
        } else {
            fdata['is_verified'] = true;
        }
        if (clinic) {
            fdata['clinic'] = clinic
        }
        if (id) {
            fdata['_id'] = id
        }
        if (category) {
            fdata['category'] = { $in: category.split(',') }
        }
        if (clinic_slug) {
            const findClinic = await User.findOne({ slug: clinic_slug });
            if (!findClinic) {
                return res.json({ success: 0, message: "Clinic not found", data: [] });
            }
            fdata['clinic'] = findClinic._id;
        }
        if (req.user) {
            if (req.user.role == "Clinic") {
                fdata['clinic'] = req.user._id
            }
        }
        if (languagesArr.length) {
            fdata['languages'] = { $in: languagesArr };
        }
        if (specilityArr.length > 0) {
            const finddoctors = await DoctorSpecialization.find({ specialization: { $in: specilityArr } });
            if (finddoctors.length > 0) {
                const docids = finddoctors.map(itm => itm.doctor);
                fdata['_id'] = { $in: docids };
            } else {
                return res.json({ success: 1, data: [], message: 'Not found', pagination: { perPage, page, totalPages: 1, totalDocs: 0 } })
            }

        }

        if (modeArr.length) {
            fdata['mode'] = { $in: modeArr };
        }
        if (url) {
            const usr = await User.findOne({ slug: url }).lean();
            if (usr) {
                fdata['_id'] = usr._id;
            }
        }
        const totalDocs = await User.countDocuments(fdata);
        const totalPages = Math.ceil(totalDocs / perPage);
        const skip = (page - 1) * perPage;


        const doctors = await User.find(fdata).populate('category').populate('clinic').sort({ createdAt: -1 }).skip(skip).limit(perPage);
        const pagination = { perPage, page, totalPages, totalDocs }
        return res.json({ success: 1, message: "List of doctors", data: doctors, pagination, fdata })
    } catch (error) {
        console.error("Error fetching doctor with specialization:", error);
    }
}
exports.handleDoctorVerify = async (req, res) => {
    try {
        const { id } = req.params;
        if (!['Admin', 'Clinic'].includes(req.user.role)) {
            return res.status(403).json({ success: 0, message: "Invalid request" });
        }
        const doctor = await User.findOne({ _id: id });
        const isverified = !doctor.is_verified;
        const upresp = await User.findOneAndUpdate({ _id: id }, { $set: { is_verified: isverified } }, { new: true });
        return res.json({ success: 1, message: "Updated successfully", data: upresp });
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}