const TestQuestion = require('../models/TestQuestion');

// CREATE
exports.createTestQuestion = async (req, res) => {
    try {
        const newQuestion = new TestQuestion(req.body);
        const saved = await newQuestion.save();
        res.status(201).json({success: 1, data: saved, message : "saved successfully"});
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// READ ALL
exports.getAllTestQuestions = async (req, res) => {
    try {
        const questions = await TestQuestion.find().populate('test_name');
        res.status(200).json({
            data : questions,
            message : "list of questions",
            success:1
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
            data : updated,
            success:1, 
            message : "updated successfully"
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
