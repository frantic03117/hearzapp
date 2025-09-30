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
    const findQuestion = await SuggestionQuestionAttempt.findOne({ user: user });
    if (findQuestion) {
        await SuggestionQuestionAttempt.findOneAndUpdate({ _id: findQuestion._id }, { $set: qdata });
    } else {
        await SuggestionQuestionAttempt.create(qdata);
    }


    return res.json({ success: 1, message: "question", data: next_question, findquestion })
}
exports.get_attempts = async (req, res) => {
    try {
        const { user, question } = req.query;
        // Build match filter
        const match = {};
        if (user) match.user = new mongoose.Types.ObjectId(user);
        if (question) match.question = new mongoose.Types.ObjectId(question);

        const resp = await SuggestionQuestionAttempt.aggregate([
            { $match: match },

            // Populate user
            {
                $lookup: {
                    from: "users", // collection name in MongoDB (check your DB, usually "users")
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

            // Populate question
            {
                $lookup: {
                    from: "suggestionquestions", // collection name in MongoDB (usually lowercase + plural)
                    localField: "question",
                    foreignField: "_id",
                    as: "question"
                }
            },
            { $unwind: { path: "$question", preserveNullAndEmptyArrays: true } },

            // Group by user
            {
                $group: {
                    _id: "$user._id",
                    user: { $first: "$user" },
                    attempts: {
                        $push: {
                            question: "$question",
                            answer: "$answer",
                            createdAt: "$createdAt"
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            // Format output
            {
                $project: {
                    _id: 0,
                    user: {
                        name: 1,
                        mobile: 1,
                        email: 1,
                        profile_image: 1
                    },
                    attempts: 1
                }
            }

        ]);

        res.json({ data: resp, success: 1, message: "list of attemps" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: 0, message: "Something went wrong" });
    }
};