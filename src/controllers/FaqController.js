const FaqModel = require('../models/Faq');

const _create = async (req, res) => {
    const { question, answer } = req.body;
    const data = new FaqModel({ question: question, answer: answer });
    await data.save().then((resp) => {
        return res.json({ data: resp, success: 1, message: "Faq created successfully." })
    })
}
const getAll = async (req, res) => {
    const items = await FaqModel.find({});
    return res.json({ data: items, errors: [], success: 1, message: "Fetched Faqs successfully." });
}
const destroy = async (req, res) => {
    const { _id } = req.params;
    await FaqModel.deleteOne({ _id: _id }).then((resp) => {
        return res.json({ data: [], errors: [], success: 1, message: " Faq deleted successfully." });
    })
}
const updatefaq = async (req, res) => {
    const { _id } = req.params;
    const faq_id = _id;
    const { question, answer } = req.body;
    const faq = await FaqModel.findOne({ _id: faq_id });
    if (faq) {
        faq.question = question;
        faq.answer = answer;
        await faq.save();
        return res.json({ data: [], errors: [], success: 1, message: "faq updated successfully." });
    } else {
        return res.json({ data: [], errors: errors, success: 0, message: "Invalid faq id" });
    }
}
module.exports = { _create, getAll, destroy, updatefaq }