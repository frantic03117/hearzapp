const { default: mongoose } = require('mongoose');
const GroupQuestionAttempts = require('../models/GroupQuestionAttempts');
const MedicalTest = require('../models/MedicalTest');
const Setting = require('../models/Setting');
const TestAttempt = require('../models/TestAttempt');
const TestQuestion = require('../models/TestQuestion');
const UserTest = require('../models/UserTest');

// CREATE
exports.createTestQuestion = async (req, res) => {
    try {
        const newQuestion = new TestQuestion(req.body);
        const saved = await newQuestion.save();
        res.status(201).json({ success: 1, data: saved, message: "saved successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// READ ALL
exports.getAllTestQuestions = async (req, res) => {
    try {
        const { id, test_name, test_for } = req.query;
        let fdata = {};
        if (id) {
            fdata['_id'] = id;
        }
        if (test_name) {
            fdata['test_name'] = test_name;
        }
        if (test_for) {
            fdata['test_for'] = { $regex: test_for, $options: 'i' };
        }
        const questions = await TestQuestion.find(fdata).populate('test_name').populate('option_key')
        // Format response if needed
        const formattedResp = await Promise.all(
            questions.map(async (re) => {
                if (re.option_key) {
                    const keyvalues = await Setting.find({ type: re.option_key?.key });
                    const options = keyvalues.map(itm => itm.media_value);
                    return {
                        ...re.toObject(),
                        options
                    };
                } else {
                    return re;
                }

            })
        );
        return res.status(200).json({
            data: formattedResp,
            message: "list of questions",
            success: 1
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ ONE
exports.getTestQuestionById = async (req, res) => {
    try {
        const question = await TestQuestion.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Not found" });
        res.status(200).json(question);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
exports.updateTestQuestion = async (req, res) => {
    try {
        const updated = await TestQuestion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: "Not found" });
        res.status(200).json({
            data: updated,
            success: 1,
            message: "updated successfully"
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// DELETE
exports.deleteTestQuestion = async (req, res) => {
    try {
        const deleted = await TestQuestion.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.status(200).json({ message: "Deleted successfully", success: 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// exports.product_suggestion_filter_question = async (req, res) => {
//     try {
//         const session_id = req.query.session_id;

//         let sessionFilters = [];
//         let sessionFilterKeys = [];

//         // Load session filters only if session_id is provided
//         if (session_id) {
//             const findsession = await UserTest.findOne({ _id: session_id }).lean();

//             if (findsession) {
//                 sessionFilters = findsession.filters || [];
//                 sessionFilterKeys = sessionFilters.map(f => f.key_name);
//             }
//         }

//         // Fetch all questions
//         const resp = await TestQuestion.find({
//             test_name: "68d27b4b8d7d13e9544f6d10"
//         }).populate("option_key");

//         // Build formatted response
//         const formattedResp = await Promise.all(
//             resp.map(async (re) => {
//                 const key = re.option_key?.key;

//                 // Load settings for options
//                 const settingValues = key
//                     ? await Setting.find({ type: key }).lean()
//                     : [];

//                 // Check if this question's key appears in session filters
//                 let user_selected_value = null;

//                 if (session_id && key && sessionFilterKeys.includes(key)) {
//                     user_selected_value =
//                         sessionFilters.find(f => f.key_name === key)?.key_value || null;
//                 }

//                 return {
//                     question: re.question,
//                     key,
//                     options: settingValues.map(v => v.media_value),
//                     user_selected_value,
//                     filter_key: settingValues
//                 };
//             })
//         );

//         return res.json({
//             success: 1,
//             message: "List of filter questions",
//             data: formattedResp,
//         });

//     } catch (err) {
//         console.error("product_suggestion_filter_question ERROR:", err);
//         return res.status(500).json({ success: 0, message: err.message });
//     }
// };

exports.user_sessions = async (req, res) => {
    try {
        const userId = req.query.user_id;
        const sessions = await UserTest.find({ user: userId });
        return res.status(200).json({
            success: 1,
            message: "List of user test sessions",
            data: sessions
        });
    }
    catch (err) {
        console.error("user_sessions ERROR:", err);
        return res.status(500).json({ success: 0, message: err.message });
    }
};
exports.product_suggestion_filter_question = async (req, res) => {
    try {
        const session_id = req.query.session_id;

        let sessionFilters = [];
        let sessionFilterKeys = [];
        let userTest
        // Load session filters only if session_id is provided
        if (session_id) {
            if (!session_id) {
                return res.status(400).json({ success: 0, message: "session_id is required" });
            }

            const sessionObjectId = mongoose.isValidObjectId(session_id)
                ? new mongoose.Types.ObjectId(session_id)
                : session_id;

            // --- 1️⃣ Handicap Score ---
            const handicapScoreResult = await TestAttempt.aggregate([
                { $match: { session_id: sessionObjectId } },
                { $group: { _id: null, totalScore: { $sum: "$score" } } },
            ]);
            const handicapScore = handicapScoreResult[0]?.totalScore || 0;

            // --- 2️⃣ Get Group (with populated LifestyleGroup info) ---
            const groupAttempt = await GroupQuestionAttempts.findOne({
                session_id,
            }).populate("group"); // assuming "group" ref: "LifeStyleGroup"

            const groupDoc = groupAttempt?.group;
            // if (!groupDoc) {
            //     return res.status(400).json({ success: 0, message: "Group not found for this session" });
            // }
            let groupNumber = 0;
            // Extract group number (from title like "GROUP 1", "GROUP 2")
            if (groupDoc) {
                const match = groupDoc.title?.match(/GROUP\s*[-]?\s*(\d)/i);
                groupNumber = match ? Number(match[1]) : null;
            }


            // --- 3️⃣ Compute Average Decibel ---
            const result = await MedicalTest.aggregate([
                { $match: { session_id: sessionObjectId } },
                { $project: { combinedEars: { $concatArrays: ["$left_ear", "$right_ear"] } } },
                { $unwind: "$combinedEars" },
                { $match: { "combinedEars.frequency": { $in: [500, 1000, 2000] } } },
                { $group: { _id: null, averageDecibal: { $avg: "$combinedEars.decibal" } } },
            ]);
            const averageDecibal = result[0]?.averageDecibal || 0;

            // --- 4️⃣ Compute Left & Right Ear Separately ---
            const separate_result = await MedicalTest.aggregate([
                { $match: { session_id: sessionObjectId } },
                {
                    $project: {
                        ears: {
                            $concatArrays: [
                                {
                                    $map: {
                                        input: "$left_ear",
                                        as: "e",
                                        in: { ear: "left", frequency: "$$e.frequency", decibal: "$$e.decibal" },
                                    },
                                },
                                {
                                    $map: {
                                        input: "$right_ear",
                                        as: "e",
                                        in: { ear: "right", frequency: "$$e.frequency", decibal: "$$e.decibal" },
                                    },
                                },
                            ],
                        },
                    },
                },
                { $unwind: "$ears" },
                { $match: { "ears.frequency": { $in: [500, 1000, 2000] } } },
                {
                    $group: { _id: "$ears.ear", averageDecibal: { $avg: "$ears.decibal" } },
                },
            ]);

            const leftAvg = separate_result.find((r) => r._id === "left")?.averageDecibal || 0;
            const rightAvg = separate_result.find((r) => r._id === "right")?.averageDecibal || 0;

            // --- 5️⃣ Determine Hearing Category ---
            const getHearingLossCategory = (avgDb) => {
                if (avgDb >= 0 && avgDb <= 40)
                    return { degree: "Mild to Moderate", ha_style: ["RIC"], ha_style_suggestion: "RIC with dome" };
                if (avgDb >= 41 && avgDb <= 55)
                    return { degree: "Moderate to Severe", ha_style: ["RIC"], ha_style_suggestion: "Custom RIC/RIC with mould" };
                if (avgDb >= 56 && avgDb <= 70)
                    return { degree: "Moderate to Moderately Severe", ha_style: ["BTE"], ha_style_suggestion: "BTE with mould" };
                if (avgDb >= 71 && avgDb <= 85)
                    return { degree: "Moderate to Severe", ha_style: ["IIC", "CIC", "ITC"], ha_style_suggestion: "IIC/CIC/ITC" };
                if (avgDb >= 86 && avgDb <= 120)
                    return { degree: "Moderately Severe to Profound", ha_style: ["BTE"], ha_style_suggestion: "UP/SP BTE with mould" };
                return { degree: "Unknown", ha_style_suggestion: "Not specified" };
            };

            const hearingCategory = getHearingLossCategory(averageDecibal);
            const separate_category = {
                leftEar: { averageDecibal: leftAvg, category: getHearingLossCategory(leftAvg) },
                rightEar: { averageDecibal: rightAvg, category: getHearingLossCategory(rightAvg) },
            };

            // --- 6️⃣ Lifestyle Group → Filters Map ---
            const groupFiltersMap = {
                1: {
                    technology_level: "Basic",
                    noiseCancellation: "Minimal",
                    price_range: "15000-70000",
                    wind_noise: "Minimal",
                    soft_hear_prescription: "Models",
                },
                2: {
                    technology_level: "Advance",
                    noiseCancellation: "Basic",
                    price_range: "71000-150000",
                    wind_noise: "Basic",
                    soft_hear_prescription: "Features",
                },
                3: {
                    technology_level: "Premium",
                    noiseCancellation: "Medium",
                    price_range: "151000-260000",
                    wind_noise: "Medium",
                    soft_hear_prescription: "Companies and warranty",
                },
                4: {
                    technology_level: "World's Best",
                    noiseCancellation: "Strong",
                    price_range: "261000-450000",
                    wind_noise: "Strong",
                    soft_hear_prescription: "Pictures",
                },
            };

            const groupFilters = groupNumber ? groupFiltersMap[groupNumber] || {} : {};

            // --- 7️⃣ Build Filter Array ---
            const filtersToSave = [
                { key_name: "degree", key_value: hearingCategory.degree },
                { key_name: "ha_style", key_value: hearingCategory.ha_style },
                { key_name: "ha_style_suggestion", key_value: hearingCategory.ha_style_suggestion },
                { key_name: "average_decibel", key_value: averageDecibal },
                { key_name: "handicap_score", key_value: handicapScore },
                { key_name: "lifestyle_group", key_value: groupDoc ? groupDoc.title : "NA" },
                ...Object.entries(groupFilters).map(([key, value]) => ({
                    key_name: key,
                    key_value: value,
                })),
            ];

            // --- 8️⃣ Add min_price / max_price from price_range ---
            const priceFilter = filtersToSave.find((f) => f.key_name === "price_range");
            if (priceFilter && typeof priceFilter.key_value === "string" && priceFilter.key_value.includes("-")) {
                const [minStr, maxStr] = priceFilter.key_value.split("-");
                const min = parseInt(minStr.trim());
                const max = parseInt(maxStr.trim());
                if (!isNaN(min) && !isNaN(max)) {
                    filtersToSave.push({ key_name: "min_price", key_value: min });
                    filtersToSave.push({ key_name: "max_price", key_value: max });
                }
            }

            // --- 9️⃣ Save or Update UserTest ---
            let userTest = await UserTest.findOne({ session_id });

            if (!userTest) {
                return res.status(404).json({ success: 0, message: "No test session found" });
            } else {
                for (const filter of filtersToSave) {
                    const idx = userTest.filters.findIndex((f) => f.key_name === filter.key_name);
                    if (idx > -1) {
                        userTest.filters[idx].key_value = filter.key_value;
                    } else {
                        userTest.filters.push(filter);
                    }
                }
            }

            await userTest.save();



            const findsession = await UserTest.findOne({ _id: session_id }).lean();

            if (findsession) {
                sessionFilters = findsession.filters || [];
                sessionFilterKeys = sessionFilters.map(f => f.key_name);
            }
            userTest = findsession
        }

        // Fetch all questions
        const resp = await TestQuestion.find({
            test_name: "68d27b4b8d7d13e9544f6d10"
        }).populate("option_key");

        // Build formatted response
        const formattedResp = await Promise.all(
            resp.map(async (re) => {
                const key = re.option_key?.key;

                // Load settings for options
                const settingValues = key
                    ? await Setting.find({ type: key }).lean()
                    : [];

                let user_selected_value = null;

                if (session_id && key && sessionFilterKeys.includes(key)) {
                    user_selected_value =
                        sessionFilters.find(f => f.key_name === key)?.key_value || null;
                }

                return {
                    question: re.question,
                    key,
                    options: settingValues.map(v => v.media_value),
                    user_selected_value,
                    filter_key: settingValues
                };
            })
        );

        // 🔹 ADD MANUAL ENTRIES FOR FILTERS NOT MATCHING ANY QUESTION
        if (session_id) {
            for (const fil of sessionFilters) {
                const exists = formattedResp.some(q => q.key === fil.key_name);

                if (!exists) {
                    // Fetch settings for this unmatched filter
                    const settingValues = await Setting.find({ type: fil.key_name }).lean();
                    const options = settingValues.map(v => v.media_value);

                    formattedResp.push({
                        question: fil.key_name.split('_').join(' '), // Simple question from key name
                        key: fil.key_name,
                        options,
                        user_selected_value: fil.key_value,
                        filter_key: settingValues
                    });
                }
            }
        }
        let response = formattedResp;
        const wanterFilterKeys = [
            "ha_style",
            "connectivity",
            "noiseCancellation",
            "price_range",
            "technology_level",
            "wind_noise"

        ];
        if (session_id) {
            response = formattedResp.filter(item => wanterFilterKeys.includes(item.key));
        }
        return res.json({
            success: 1,
            message: "List of filter questions",
            data: response,
            userTest
        });

    } catch (err) {
        console.error("product_suggestion_filter_question ERROR:", err);
        return res.status(500).json({ success: 0, message: err.message });
    }
};
