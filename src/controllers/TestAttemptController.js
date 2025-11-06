const TestQuestion = require("../models/TestQuestion");
const TestAttempt = require("../models/TestAttempt");
const crypto = require("crypto");
const GroupQuestionAttempts = require("../models/GroupQuestionAttempts");
const MedicalTest = require("../models/MedicalTest");

exports.createOrUpdateAttempt = async (req, res) => {
    try {
        const { test_name, question, selectedOption } = req.body;
        // console.log(req.user.role)
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
        let attempt = await TestAttempt.findOne({ test_name, user, question });
        if (attempt) {
            attempt.selectedOption = selectedOption || attempt.selectedOption;
            attempt.answerText = answerText || attempt.answerText;
            attempt.isCorrect = null;
            attempt.score = questionmarks[answerText];
            await attempt.save();
            return res.status(200).json({ message: "Answer updated", data: attempt, success: 1 });
        }
        attempt = new TestAttempt({
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
        const { group, difficulty } = req.body;
        if (!group) {
            return res.status(400).json({
                success: 0,
                message: "Group is required"
            });
        }
        if (!difficulty) {
            return res.status(400).json({
                success: 0,
                message: "Difficulty is required"
            });
        }
        const existingAttempt = await GroupQuestionAttempts.findOne({
            user: req.user._id,
            group,
            difficulty
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
                difficulty
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
        // --- 1️⃣ Get Total Handicap Score ---
        const handicapScoreResult = await TestAttempt.aggregate([
            {
                $group: {
                    _id: null,
                    totalScore: { $sum: "$score" }
                }
            }
        ]);

        const handicapScore = handicapScoreResult[0]?.totalScore || 0;

        // --- 2️⃣ Get Average Decibel from Both Ears ---
        const result = await MedicalTest.aggregate([
            {
                $project: {
                    combinedEars: { $concatArrays: ["$left_ear", "$right_ear"] }
                }
            },
            { $unwind: "$combinedEars" },
            {
                $match: {
                    "combinedEars.frequency": { $in: [500, 1000, 2000] }
                }
            },
            {
                $group: {
                    _id: null,
                    averageDecibal: { $avg: "$combinedEars.decibal" }
                }
            }
        ]);

        const averageDecibal = result[0]?.averageDecibal || 0;
        const separate_result = await MedicalTest.aggregate([
            // Unwind both ears separately so we can tag them
            {
                $project: {
                    left_ear: 1,
                    right_ear: 1
                }
            },
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
            {
                $match: {
                    "ears.frequency": { $in: [500, 1000, 2000] }
                }
            },
            {
                $group: {
                    _id: "$ears.ear",
                    averageDecibal: { $avg: "$ears.decibal" }
                }
            }
        ]);

        const leftEar = separate_result.find(r => r._id === "left");
        const rightEar = separate_result.find(r => r._id === "right");

        const leftAvg = leftEar?.averageDecibal || 0;
        const rightAvg = rightEar?.averageDecibal || 0;

        // --- 3️⃣ Determine Hearing Loss Category ---
        const getHearingLossCategory = (avgDb) => {
            if (avgDb >= 0 && avgDb <= 55) return "Mild to Moderate";
            if (avgDb >= 41 && avgDb <= 85) return "Moderate to Severe";
            if (avgDb >= 41 && avgDb <= 70) return "Moderate to Moderately Severe";
            if (avgDb >= 60 && avgDb <= 120) return "Moderately Severe to Profound";
            return "Unknown";
        };

        const hearingCategory = getHearingLossCategory(averageDecibal);
        const separate_cateogry = {
            leftEar: {
                averageDecibal: leftAvg,
                category: getHearingLossCategory(leftAvg)
            },
            rightEar: {
                averageDecibal: rightAvg,
                category: getHearingLossCategory(rightAvg)
            }
        };

        // --- 4️⃣ Send Response ---
        res.status(200).json({
            success: 1,
            data: {
                handicapScore,
                averageDecibal,
                hearingCategory,
                separate_cateogry
            }
        });
    } catch (err) {
        res.status(500).json({
            success: 0,
            message: err.message
        });
    }
};