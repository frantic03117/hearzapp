const SuggestionQuestion = require("../models/SuggestionQuestion");
const SuggestionQuestionAttempt = require("../models/SuggestionQuestionAttempt");

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
        const { type, step, id } = req.query;
        let fdata = {};
        if (type) {
            fdata['type'] = type;
        }
        if (step) {
            fdata['step'] = step;
        }
        if (id) {
            fdata['_id'] = id;
        }
        const resp = await SuggestionQuestion.find(fdata);
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
exports.save_attempt = async (req, res) => {
    const user = req.user._id;
    const { question, answer } = req.body;
    const findquestion = await SuggestionQuestion.findById(question);
    if (!findquestion) {
        return res.json({ success: 0, message: "not found" })
    }
    const hasFollowup = findquestion.hasFollowup;
    const type = findquestion.type;
    let step = findquestion.step;
    let next_question = false;
    if (type == "Primary") {
        let findnextqu = await SuggestionQuestion.findOne({ step: step, type: "Secondary", parent_question: question, parent_answer: answer });
        if (!findnextqu) {
            step = step + 1;
            next_question = await SuggestionQuestion.findOne({ type: "Primary", step: step });
        } else {
            next_question = findnextqu;
        }
    }
    if (type == "Secondary") {
        step = step + 1;
        next_question = await SuggestionQuestion.findOne({ type: "Primary", step: step });
    }
    const qdata = {
        question,
        answer,
        user
    }
    const attempt = await SuggestionQuestionAttempt.create(qdata);

    return res.json({ success: 1, message: "question", data: next_question, findquestion, attempt })
}