const Setting = require("../models/Setting");
const User = require("../models/User");
const SECRET_KEY = process.env.SECRET_KEY ?? "frantic@hearzapp#6887";
const jwt = require('jsonwebtoken');

async function generateUniqueSlug(name) {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    let slug = 'clinic-' + baseSlug;
    let count = 1;
    const alreadusers = await User.find({ slug });
    // Check if the slug already exists
    count = alreadusers.length + 1;
    if (count > 1) {
        slug = `${slug}-${count}`;
    }


    return slug;
}

exports.store_profile = async (req, res) => {
    try {
        const fields = ['mobile', 'name'];
        const emptyFields = fields.filter(field => !req.body[field]);
        if (emptyFields.length > 0) {
            return res.json({ success: 0, message: 'The following fields are required:' + emptyFields.join(','), fields: emptyFields });
        }
        const { name, email, mobile, id } = req.body;

        let slug = await generateUniqueSlug(req.body.name);
        if (req.body.city) {
            slug = slug + "-in-" + req.body.city
        }
        // if (!req.user) {
        //     const checkIsMobileVerified = await OtpModel.findOne({ mobile: mobile, is_verified: true });
        //     if (!checkIsMobileVerified) {
        //         return res.json({ success: 0, message: "Mobile number is not verified" });
        //     }
        // }
        const mobilefien = { mobile: mobile };
        if (id) {
            mobilefien['_id'] = { $ne: id }
        }
        const isMobileExists = await User.findOne(mobilefien);
        if (mobile.toString().length != 10) {
            return res.json({ success: 0, message: "Mobile is not valid" })
        }
        if (isMobileExists) {
            return res.json({
                errors: [{ 'message': "Mobile is already in use" }],
                success: 0,
                data: [],
                message: "Mobile is already in use"
            })
        }
        const lastReuest = await User.findOne({ role: "Clinic" }).sort({ request_id: -1 });
        let new_request_id = 1;
        if (lastReuest) {
            new_request_id = lastReuest.request_id + 1
        }
        const prefix = 'CLINIC';
        const data = {
            ...req.body,
            slug: slug.toLowerCase(),
            request_id: new_request_id,
            custom_request_id: prefix + String(new_request_id).padStart(10, '0'),
            name: name,
            is_verified: true,
            mobile: mobile,
            role: "Clinic"

        }
        if (req.body.email) {
            data['email'] = email.toLowerCase()
        }
        if (req.body.category) {
            data['category'] = JSON.parse(req.body.category)
        }

        if (req.files.profile_image) {
            data['profile_image'] = req.files.profile_image[0].path
        }
        if (req.files.registration_certificate) {
            data['registration_certificate'] = req.files.registration_certificate[0].path
        }
        if (req.files.graduation_certificate) {
            data['graduation_certificate'] = req.files.graduation_certificate[0].path
        }
        if (req.files.post_graduation_certificate) {
            data['post_graduation_certificate'] = req.files.post_graduation_certificate[0].path
        }
        if (req.files.mci_certificate) {
            data['mci_certificate'] = req.files.mci_certificate[0].path
        }
        if (req.files.aadhaar_front) {
            data['aadhaar_front'] = req.files.aadhaar_front[0].path
        }
        if (req.files.aadhaar_back) {
            data['aadhaar_back'] = req.files.aadhaar_back[0].path
        }
        if (req.files.pan_image) {
            data['pan_image'] = req.files.pan_image[0].path
        }
        let resp;
        if (id) {
            resp = await User.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
        } else {
            resp = await User.create(data);
        }


        // const token = jwt.sign({ user: tokenuser }, SECRET_KEY, { expiresIn: "1 days" })

        return res.json({ success: 1, message: `Clinic ${id ? 'updated' : 'created'} successfully`, data: resp })


    } catch (err) {
        return res.json({
            errors: [{ 'message': err.message }],
            success: 0,

            data: [],
            message: err.message
        })
    }
}

exports.get_clinics = async (req, res) => {
    try {
        const { category, state, city, page = 1, perPage = 10, id, url } = req.query;
        const fdata = {
            role: "Clinic",

        }
        if (id) {
            const userfound = await User.findOne({ _id: id });
            fdata['_id'] = userfound._id;
        }
        if (url) {
            fdata['slug'] = url;
        }
        if (category) {
            const findsetting = await Setting.find({ _id: { $in: category.split(',') } });
            fdata['category'] = { $in: findsetting.map(itm => itm._id) };
        }
        if (state) {
            fdata['state'] = { $regex: state, $options: "i" }
        }
        if (city) {
            fdata['city'] = { $in: city.split(',') }
        }
        let project = {
            password: 0,
        };
        if (req.user) {
            if (req.user.role == "Clinic") {
                fdata['_id'] = req.user._id
            }
            if (req.user.role == "User") {
                fdata['is_verified'] = true
                project = {
                    password: 0,
                }
            } else {
                project = {
                    _v: 0
                }
            }
        } else {
            fdata['is_verified'] = true
        }


        const totalDocs = await User.countDocuments(fdata);
        const totalPages = Math.ceil(totalDocs / perPage);
        const skip = (page - 1) * perPage;
        const result = await User.aggregate([
            {
                $match: fdata
            },
            {
                $project: project
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "clinic",
                    as: "doctors",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                profile_image: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "settings",
                    localField: "category",     // your array of ObjectIds
                    foreignField: "_id",        // primary key of `Setting`
                    as: "categories"
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            }
        ]);
        const pagination = { totalPages, totalDocs, perPage, page };
        return res.json({ pagination, success: 1, data: result, message: "List of clinics", fdata });

    } catch (err) {
        return res.json({ success: 0, message: err.message, data: false })
    }
}
exports.clinic_login = async (req, res) => {
    try {
        const fields = ['password', 'email'];
        const emptyFields = fields.filter(field => !req.body[field]);
        if (emptyFields.length > 0) {
            return res.json({ success: 0, message: 'The following fields are required:' + emptyFields.join(','), fields: emptyFields });
        }
        const { email, password } = req.body;
        const fdata = {
            email: email,
            password: password,
            role: "Clinic"
        }
        const userfind = await User.findOne(fdata);
        if (!userfind) {
            return res.json({ success: 0, message: "Invalid credentials", data: null });
        }
        const tokenuser = {
            _id: userfind._id,
        }
        const token = userfind ? jwt.sign({ user: tokenuser }, SECRET_KEY, { expiresIn: "30 days" }) : ""
        return res.json({ success: 1, message: 'Login successfully', data: token });
    } catch (err) {
        return res.json({ success: 0, message: err.message });
    }
}
exports.clinic_verified = async (req, res) => {
    try {
        const { id } = req.params;

        // find clinic
        const clinic = await User.findById(id);
        if (!clinic) {
            return res.status(404).json({ success: 0, message: "Clinic not found" });
        }

        // toggle is_verified
        clinic.is_verified = !clinic.is_verified;
        await clinic.save();

        return res.json({
            success: 1,
            message: `Clinic ${clinic.is_verified ? "verified" : "unverified"} successfully`,
            data: clinic,
        });
    } catch (error) {
        return res.status(500).json({
            success: 0,
            message: error.message,
        });
    }
};
