const Setting = require('../models/Setting');
const TestQuestion = require('../models/TestQuestion');

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
exports.product_suggestion_filter_question = async (req, res) => {
    try {
        const resp = await TestQuestion.find({
            test_name: "68d27b4b8d7d13e9544f6d10"
        }).populate("option_key");

        // Format response if needed
        const formattedResp = await Promise.all(
            resp.map(async (re) => {
                const keyvalues = await Setting.find({ type: re.option_key?.key });
                const options = keyvalues.map(itm => itm.media_value);
                return {
                    question: re.question,
                    key: re.option_key?.key,
                    options
                };
            })
        );

        return res.json({
            success: 1,
            message: "List of filter question",

            data: formattedResp,
        });
    } catch (err) {
        return res.status(500).json({ success: 0, message: err.message });
    }
};