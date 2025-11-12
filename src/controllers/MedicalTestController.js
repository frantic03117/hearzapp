const MedicalTest = require("../models/MedicalTest");
const User = require("../models/User");

exports.startTest = async (req, res) => {
    try {
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
    const { session_id, ear, eardata } = req.body;
    if (!session_id) {
        return res.status(500).json({ success: 0, message: "Session id is required", data: [] });

    }
    // Validate ear
    if (!['left_ear', 'right_ear'].includes(ear)) {
        return res.status(500).json({ success: 0, message: "Please select correct ear either left_ear, right_ear", data: [] });
    }

    // Validate eardata
    if (!Array.isArray(eardata) || eardata.length === 0) {
        return res.status(500).json({ success: 0, message: "eardata must be a non-empty array", data: [] });
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
        const {
            id,
            created_from,
            created_to,
            user,
            status,
            for_self,
            page = 1,
            limit = 10
        } = req.query;

        // Filter by id
        if (id) {
            fdata['_id'] = id;
        }

        // Only return if both ears exist and not empty
        fdata.left_ear = { $exists: true, $not: { $size: 0 } };
        fdata.right_ear = { $exists: true, $not: { $size: 0 } };

        // Filter by user explicitly (if provided)
        if (user) {
            fdata['user'] = user;
        }

        // If logged-in user is "User" role, restrict to their own data
        if (req.user && req.user.role === "User") {
            fdata['user'] = req.user._id;
        }

        // Filter by status
        if (status) {
            fdata['status'] = status;
        }

        // Filter by for_self
        if (for_self) {
            fdata['for_self'] = for_self; // "Yes" or "No"
        }

        // Date range filter
        if (created_from || created_to) {
            fdata.createdAt = {};
            if (created_from) {
                fdata.createdAt.$gte = new Date(created_from);
            }
            if (created_to) {
                fdata.createdAt.$lte = new Date(created_to);
            }
        }

        // Pagination setup
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Count total records (before pagination)
        const total = await MedicalTest.countDocuments(fdata);

        // Fetch data with pagination
        const resp = await MedicalTest.find(fdata)
            .populate([
                {
                    path: "user",
                    select: "name email mobile profile_image",
                },
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: 1,
            message: "Medical Tests",
            data: resp,
            fdata,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: 0,
            message: "Server error",
            error: err.message,
        });
    }
};
