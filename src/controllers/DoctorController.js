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
    const { url, id, languages = [], specility = [], mode = [], page = 1, perPage = 10 } = req.query;


    try {
        const languagesArr = Array.isArray(languages) ? languages : languages.split(',').filter(Boolean);
        const specilityArr = Array.isArray(specility) ? specility : specility.split(',').filter(Boolean);
        const modeArr = Array.isArray(mode) ? mode : mode.split(',').filter(Boolean);

        const fdata = {
            "role": "Doctor"
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


        const doctors = await User.aggregate([
            {
                $match: fdata
            },
            {
                $lookup: {
                    from: "doctorspecializations",
                    localField: "_id",
                    foreignField: "doctor",
                    as: "specializations",
                }
            },
            {
                $lookup: {
                    from: "specializations",
                    localField: "specializations.specialization",
                    foreignField: "_id",
                    as: "specializationDetails",

                }
            },

            {
                $lookup: {
                    from: "slots",
                    localField: "_id",
                    foreignField: "doctor",
                    as: "slots",
                    pipeline: [
                        {
                            $match: { start_time: { $gte: new Date() } }
                        },
                        { $limit: 2 }
                    ]
                }
            },


            {
                $project: {
                    _id: 1, // Including _id field
                    request_id: 1,
                    custom_request_id: 1,
                    profile_image: 1,
                    slug: 1,
                    name: 1,
                    email: 1,
                    mobile: 1,
                    gender: 1,
                    dob: 1,
                    profession: 1,
                    marital_status: 1,
                    address: 1,
                    about_yourself: 1,
                    refer_by: 1,
                    ref_code: 1,
                    role: 1,
                    roles: 1,
                    mci_number: 1,
                    coordinates: 1,
                    languages: 1,
                    mode: 1,
                    state: 1,
                    city: 1,
                    pincode: 1,
                    slots: {
                        $map: {
                            input: "$slots",
                            as: "slot",
                            in: {
                                _id: "$$slot._id",
                                doctor: "$$slot.doctor",
                                status: "$$slot.status",
                                // Include other fields if needed...

                                start_time: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date: "$$slot.start_time",
                                        timezone: "Asia/Kolkata"
                                    }
                                },
                                end_time: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date: "$$slot.end_time",
                                        timezone: "Asia/Kolkata"
                                    }
                                }
                            }
                        }
                    },
                    registration_certificate: 1,
                    graduation_certificate: 1,
                    post_graduation_certificate: 1,
                    mci_certificate: 1,
                    aadhaar_front: 1,
                    aadhaar_back: 1,
                    pan_image: 1,
                    fcm_token: 1,
                    is_deleted: 1,
                    jwt_token: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    specializationDetails: { title: 1, _id: 1 }
                }
            },
            {
                $addFields: {
                    nearestSlotTime: {
                        $cond: [
                            { $gt: [{ $size: "$slots" }, 0] },
                            { $min: "$slots.start_time" },
                            null
                        ]
                    }
                }
            },
            {
                $sort: {
                    nearestSlotTime: 1
                }
            },
            { $skip: skip },
            { $limit: perPage },
        ]);
        const pagination = { perPage, page, totalPages, totalDocs }
        return res.json({ success: 1, message: "List of doctors", data: doctors, pagination })
    } catch (error) {
        console.error("Error fetching doctor with specialization:", error);
    }
}
exports.add_appointment = async (req, res) => {

}
