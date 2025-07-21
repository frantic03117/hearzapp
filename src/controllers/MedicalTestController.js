const MedicalTest = require("../models/MedicalTest");
const User = require("../models/User");

exports.startTest = async (req, res) => {
    try {
        console.log(req.user);
        const { for_self } = req.body;
        if (!['Yes', 'No'].includes(for_self)) {
            return res.json({ success: 0, message: "for_self must be either Yes or No" });
        }
        let usercreated;
        if (for_self == "No") {
            const { name, mobile, gender, dob, profession, marital_status, address, state, city, about_yourself } = req.body;
            if (!name || !mobile) {
                return res.json({ success: 0, message: "Patient name and mobile is mandatory for for_self = No" })
            }
            const findMobileExists = await User.findOne({ mobile: mobile });
            if (findMobileExists) {
                usercreated = findMobileExists;
            } else {
                const udata = {
                    name: name,
                    mobile: mobile
                }
                if (dob) udata['dob'] = dob;
                if (gender) udata['gender'] = gender;
                if (profession) udata['profession'] = profession;
                if (marital_status) udata['marital_status'] = marital_status;
                if (address) udata['addresss'] = address;
                if (state) udata['state'] = state;
                if (city) udata['city'] = city;
                if (about_yourself) udata['about_yourself'] = about_yourself;
                usercreated = await User.create(udata);
            }

        }
        const patient = for_self == "Yes" ? req.user._id : usercreated._id;
        const data = {
            'user': req.user._id,
            'patient': patient,
            'for_self': for_self,
        };
        const resp = await MedicalTest.create(data);
        return res.json({ success: 1, message: "Test created successfully", data: resp });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
}
exports.updateEarTest = async (req, res) => {
    const { id } = req.params;
    const { ear, eardata } = req.body;

    // Validate ear
    if (!['left_ear', 'right_ear'].includes(ear)) {
        return res.json({ success: 0, message: "Please select correct ear either left_ear, right_ear", data: [] });
    }

    // Validate eardata
    if (!Array.isArray(eardata) || eardata.length === 0) {
        return res.json({ success: 0, message: "eardata must be a non-empty array", data: [] });
    }

    // Optional: Validate structure of each eardata item
    const invalidItem = eardata.find(item =>
        typeof item.frequency !== 'number' || typeof item.decibal !== 'number'
    );
    if (invalidItem) {
        return res.json({ success: 0, message: "Each item in eardata must have numeric frequency and decibal", data: [] });
    }

    try {
        const findtst = await MedicalTest.findById(id);
        if (!findtst) {
            return res.json({ success: 0, message: "MedicalTest not found", data: [] });
        }

        const edata = findtst[ear] || [];
        const ndata = [...edata, ...eardata];

        await MedicalTest.findByIdAndUpdate(id, { $set: { [ear]: ndata } })

        return res.json({ success: 1, message: "Ear updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: 0, message: "Server error", error: err.message });
    }
};

exports.medicaltests = async (req, res) => {
    try {
        const fdata = {};
        if (req.user) {
            if (req.user.role == "User") {
                fdata['user'] = req.user._id;
            }
        }
        const resp = await MedicalTest.find(fdata).populate([
            {
                path: "user",
                select: "name email mobile profile_image"
            }
        ]);
        return res.json({ success: 1, message: "Medical Tests", data: resp })
    } catch (err) {
        return res.status(500).json({ success: 0, message: "Server error", error: err.message });
    }
}
