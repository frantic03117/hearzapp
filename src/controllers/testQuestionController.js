const Setting = require('../models/Setting');
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

        // Load session filters only if session_id is provided
        if (session_id) {
            const findsession = await UserTest.findOne({ _id: session_id }).lean();

            if (findsession) {
                sessionFilters = findsession.filters || [];
                sessionFilterKeys = sessionFilters.map(f => f.key_name);
            }
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

        return res.json({
            success: 1,
            message: "List of filter questions",
            data: formattedResp,
        });

    } catch (err) {
        console.error("product_suggestion_filter_question ERROR:", err);
        return res.status(500).json({ success: 0, message: err.message });
    }
};
