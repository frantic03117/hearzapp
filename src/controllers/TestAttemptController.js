const TestQuestion = require("../models/TestQuestion");
const TestAttempt = require("../models/TestAttempt");

exports.createOrUpdateAttempt = async (req, res) => {
    try {
        const { test_name, question, selectedOption, answerText } = req.body;
        const user = req.user._id;
        if (req.user.role != "User") {
            return res.status(403).json({ success: 0, message: "Unauthorized" })
        }
        if (!test_name) return res.status(400).json({ error: "test_name is required" });

        if (!question) return res.status(400).json({ error: "question is required" });

        // Check question belongs to same test_name
        const q = await TestQuestion.findById(question);
        if (!q) {
            return res.status(400).json({ error: "Question not found" });
        }
        if (q.test_name.toString() !== test_name) {
            return res.status(400).json({ error: "Question does not belong to this test_name" });
        }

        // Require at least one form of answer
        if (!selectedOption && !answerText) {
            return res.status(400).json({ error: "Either selectedOption or answerText is required" });
        }

        // Check if user already attempted this question
        let attempt = await TestAttempt.findOne({ test_name, user, question });

        if (attempt) {
            // Update existing attempt
            attempt.selectedOption = selectedOption || attempt.selectedOption;
            attempt.answerText = answerText || attempt.answerText;
            attempt.isCorrect = null;
            attempt.score = 0;
            await attempt.save();
            return res.status(200).json({ message: "Answer updated", attempt });
        }

        // Otherwise create new attempt
        attempt = new TestAttempt({
            test_name,
            user,
            question,
            selectedOption,
            answerText
        });

        await attempt.save();
        res.status(201).json({ message: "Answer saved", attempt });

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
        res.json(attempt);
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
        res.json({ message: "Attempt deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
