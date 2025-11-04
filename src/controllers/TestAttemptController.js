const TestQuestion = require("../models/TestQuestion");
const TestAttempt = require("../models/TestAttempt");
const crypto = require("crypto");

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
exports.getProductSuggestionQuestion = async (req, res) => {
    const questions = require('../json/ProductSuggestion.json');
    const { id, step, type, key } = req.query;

    let fdata = {};
    if (id) fdata.id = id;
    if (step) fdata.step = parseInt(step, 10); // ensure step is a number
    if (type) fdata.type = type;
    if (key) fdata.key = key;

    // If no filters provided, return all questions
    let results = questions;
    if (Object.keys(fdata).length > 0) {
        results = questions.filter(q => {
            return Object.entries(fdata).every(([k, v]) => q[k] === v);
        });
    }

    return res.json({ success: 1, data: results });
};

