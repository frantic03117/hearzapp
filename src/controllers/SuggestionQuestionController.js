const SuggestionQuestion = require("../models/SuggestionQuestion")

exports.createQuestion = async (req, res) => {
    try {
        const resp = await SuggestionQuestion.create(req.body);
        return res.json({ success: 1, message: "Question created successfully", data: resp });
    } catch (err) {
        return res.json({ success: 0, messsage: err.messsage })
    }
}


exports.allQuestions = async (req, res) => {
    try {
        const resp = await SuggestionQuestion.find();
        return res.json({ success: 1, message: "Question fetched successfully", data: resp });
    } catch (err) {
        return res.json({ success: 0, messsage: err.messsage })
    }
}
exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const resp = await SuggestionQuestion.findOneAndUpdate({ _id: id }, { $set: req.body });
        return res.json({ success: 1, message: "Question created successfully", data: resp });
    } catch (err) {
        return res.json({ success: 0, messsage: err.messsage })
    }
}
exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const resp = await SuggestionQuestion.findOneAndDelete({ _id: id });
        return res.json({ success: 1, message: "Question delete successfully", data: resp });
    } catch (err) {
        return res.json({ success: 0, messsage: err.messsage })
    }
}