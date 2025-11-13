const TestQuestion = require("../models/TestQuestion");
const TestAttempt = require("../models/TestAttempt");
const GroupQuestionAttempts = require("../models/GroupQuestionAttempts");
const MedicalTest = require("../models/MedicalTest");
const UserTest = require("../models/UserTest");
exports.createOrUpdateAttempt = async (req, res) => {
    try {
        const { session_id, test_name, question, selectedOption } = req.body;
        // console.log(req.user.role)
        if (!session_id) {
            return res.status(500).json({ success: 0, message: "Session is required" })
        }
        const user = req.user.role == "Admin" ? req.body.user : req.user._id;
        if (!user) {
            return res.status(403).json({ success: 0, message: "Unauthorized" })
        }
        if (!test_name) return res.status(400).json({ data: null, success: 0, message: "test_name is required" });

        if (!question) return res.status(400).json({ data: null, success: 0, message: "question is required" });

        // Check question belongs to same test_name
        const q = await TestQuestion.findById(question);
        if (!q) {
            return res.status(400).json({ error: "Question not found" });
        }
        if (q.test_name.toString() !== test_name) {
            return res.status(400).json({ error: "Question does not belong to this test_name" });
        }
        if (!selectedOption) {
            return res.status(400).json({ error: "Selected Option is required" });
        }
        const findoption = q.options.find(obj => obj._id.toString() == selectedOption.toString());
        const answerText = findoption.option;
        const questionmarks = { "No": 0, "Sometimes": 2, "Yes": 4 }
        let attempt = await TestAttempt.findOne({ session_id, test_name, user, question });
        if (attempt) {
            attempt.selectedOption = selectedOption || attempt.selectedOption;
            attempt.answerText = answerText || attempt.answerText;
            attempt.isCorrect = null;
            attempt.score = questionmarks[answerText];
            await attempt.save();
            return res.status(200).json({ message: "Answer updated", data: attempt, success: 1 });
        }
        attempt = new TestAttempt({
            session_id,
            test_name,
            user,
            question,
            selectedOption,
            answerText,
            score: questionmarks[answerText]
        });

        await attempt.save();
        res.status(201).json({ message: "Answer saved", data: attempt, success: 1 });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
// Get all attempts
exports.getAttempts = async (req, res) => {
    try {
        const {
            id,
            test_name,
            question,
            user,
            page = 1,
            perPage = 10,
            sortBy = "createdAt",   // default sorting field
            sortOrder = "desc"      // "asc" or "desc"
        } = req.query;

        // Build filter object
        let filter = {};
        if (id) filter._id = id;
        if (test_name) filter.test_name = test_name;
        if (question) filter.question = question;
        if (user) filter.user = user;

        // Build sorting object
        let sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(perPage);
        const limit = parseInt(perPage);

        // Query
        // await TestAttempt.deleteMany({})
        const attempts = await TestAttempt.find(filter)
            .populate("test_name")
            .populate("user")
            .populate("question")
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Total count (without pagination)
        const total = await TestAttempt.countDocuments(filter);

        res.json({
            success: 1,
            total,
            page: parseInt(page),
            perPage: parseInt(perPage),
            totalPages: Math.ceil(total / perPage),
            data: attempts
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Update attempt (e.g. change answers before finish)
exports.updateAttempt = async (req, res) => {
    try {
        const attempt = await TestAttempt.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });
        res.json({ data: attempt, success: 1, message: "Uppated Test" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteAttempt = async (req, res) => {
    try {
        const attempt = await TestAttempt.findById(req.params.id);
        if (!attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        // Check ownership
        if (attempt.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not allowed to delete this attempt" });
        }

        await attempt.deleteOne();
        res.json({ message: "Attempt deleted successfully", success: 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.save_group_question_answer = async (req, res) => {
    try {
        const { session_id, group } = req.body;
        if (!group) {
            return res.status(400).json({
                success: 0,
                message: "Group is required"
            });
        }

        const existingAttempt = await GroupQuestionAttempts.findOne({
            user: req.user._id,
            group,
            session_id

        });
        if (existingAttempt) {
            await GroupQuestionAttempts.findByIdAndDelete(existingAttempt._id);
            return res.status(200).json({
                success: 1,
                message: "Previous attempt deleted successfully"
            });
        } else {
            const newAttempt = await GroupQuestionAttempts.create({
                user: req.user._id,
                group,
                session_id
            });
            return res.status(200).json({
                success: 1,
                message: "Attempt saved successfully",
                data: newAttempt
            });
        }

    } catch (err) {
        res.status(500).json({
            success: 0,
            message: err.message
        });
    }
};

exports.fetch_group_question_answer = async (req, res) => {
    try {
        const { user, group, difficulty } = req.query;
        const fdata = {};
        if (req.user.role == "Admin") {
            fdata['user'] = req.user._id
        }
        if (group) {
            fdata['group'] = group
        }
        if (difficulty) {
            fdata['difficulty'] = difficulty
        }
        const resp = await GroupQuestionAttempts.find(fdata).populate([
            {
                path: "group"
            },
            {
                path: "difficulty"
            }
        ])
        return res.json({ success: 1, data: resp, message: "group difficulty" })
    } catch (err) {
        res.status(500).json({
            success: 0,
            message: err.message
        });
    }
}
exports.get_test_report = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ success: 0, message: "Session ID is required" });
        }
        const sessionObjectId = mongoose.isValidObjectId(session_id)
            ? new mongoose.Types.ObjectId(session_id)
            : session_id;
        const handicapScoreResult = await TestAttempt.aggregate([
            { $match: { session_id: sessionObjectId } },
            {
                $group: {
                    _id: null,
                    totalScore: { $sum: "$score" }
                }
            }
        ]);

        const handicapScore = handicapScoreResult[0]?.totalScore || 0;

        // --- 2️⃣ Average Decibel (filter by session_id) ---
        const result = await MedicalTest.aggregate([
            { $match: { session_id: sessionObjectId } },
            { $project: { combinedEars: { $concatArrays: ["$left_ear", "$right_ear"] } } },
            { $unwind: "$combinedEars" },
            { $match: { "combinedEars.frequency": { $in: [500, 1000, 2000] } } },
            {
                $group: {
                    _id: null,
                    averageDecibal: { $avg: "$combinedEars.decibal" }
                }
            }
        ]);

        const averageDecibal = result[0]?.averageDecibal || 0;

        // --- 2️⃣.1 Left / Right ear averages (filter by session_id) ---
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
                                    in: { ear: "left", frequency: "$$e.frequency", decibal: "$$e.decibal" }
                                }
                            },
                            {
                                $map: {
                                    input: "$right_ear",
                                    as: "e",
                                    in: { ear: "right", frequency: "$$e.frequency", decibal: "$$e.decibal" }
                                }
                            }
                        ]
                    }
                }
            },
            { $unwind: "$ears" },
            { $match: { "ears.frequency": { $in: [500, 1000, 2000] } } },
            {
                $group: {
                    _id: "$ears.ear",
                    averageDecibal: { $avg: "$ears.decibal" }
                }
            }
        ]);

        const leftAvg = separate_result.find(r => r._id === "left")?.averageDecibal || 0;
        const rightAvg = separate_result.find(r => r._id === "right")?.averageDecibal || 0;

        // --- 3️⃣ Determine Hearing Loss Category ---
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
                return { degree: "Moderately Severe to Profound", ha_style: ["BTE"], ha_style_suggestion: "UP/SP BTE with Mould" };
            return { degree: "Unknown", ha_style_suggestion: "Not specified" };
        };

        const hearingCategory = getHearingLossCategory(averageDecibal);
        const separate_category = {
            leftEar: {
                averageDecibal: leftAvg,
                category: getHearingLossCategory(leftAvg)
            },
            rightEar: {
                averageDecibal: rightAvg,
                category: getHearingLossCategory(rightAvg)
            }
        };

        // --- 4️⃣ Save Results in UserTest.filters[] ---
        let userTest = await UserTest.findOne({ user: user_id, session_id });

        const filtersToSave = [
            { key_name: "degree", key_value: hearingCategory.degree },
            { key_name: "ha_style", key_value: hearingCategory.ha_style },
            { key_name: "ha_style_suggestion", key_value: hearingCategory.ha_style_suggestion },
            { key_name: "average_decibel", key_value: averageDecibal },
            { key_name: "handicap_score", key_value: handicapScore }
        ];

        if (!userTest) {
            userTest = new UserTest({
                user: user_id,
                session_id,
                filters: filtersToSave
            });
        } else {
            for (const filter of filtersToSave) {
                const idx = userTest.filters.findIndex(f => f.key_name === filter.key_name);
                if (idx > -1) {
                    userTest.filters[idx].key_value = filter.key_value;
                } else {
                    userTest.filters.push(filter);
                }
            }
        }

        await userTest.save();

        // --- 5️⃣ Response ---
        res.status(200).json({
            success: 1,
            data: {
                handicapScore,
                averageDecibal,
                hearingCategory,
                separate_category,
                savedFilters: userTest.filters
            }
        });

    } catch (err) {
        console.error("Error in get_test_report:", err);
        res.status(500).json({
            success: 0,
            message: err.message
        });
    }
};
exports.start_test = async (req, res) => {
    try {
        const user_id = req.user._id;
        const resp = await UserTest.create({ user: user_id });
        return res.json({ success: 1, message: "Start session", data: resp })

    } catch (err) {
        res.status(500).json({
            success: 0,
            message: err.message
        });
    }
}
exports.save_filter_selection = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { session_id, key_name, value } = req.body;
        if (!key_name || value === undefined) {
            return res.status(400).json({
                success: 0,
                message: "key_name and value are required",
            });
        }
        let userTest = await UserTest.findOne({ user: user_id, _id: session_id });
        if (!userTest) {
            return res.json({ success: 0, message: "Session not found" })
        }
        const keyIndex = userTest.filters.findIndex(k => k.key_name === key_name);
        if (keyIndex > -1) {
            userTest.filters[keyIndex].key_value = value;
        } else {
            userTest.filters.push({ key_name, key_value: value });
        }
        await userTest.save();
        res.status(200).json({
            success: 1,
            message: "Filter selection saved successfully",
            data: userTest
        });

    } catch (err) {
        res.status(500).json({
            success: 0,
            message: err.message
        });
    }
}