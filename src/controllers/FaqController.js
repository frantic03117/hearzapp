const FaqModel = require('../models/Faq');

const _create = async (req, res) => {
    const { question, answer } = req.body;
    const data = new FaqModel({ question: question, answer: answer });
    await data.save().then((resp) => {
        return res.json({ data: resp, success: 1, message: "Faq created successfully." })
    })
}
const getAll = async (req, res) => {
    const { id, page = 1, perPage = 10 } = req.query;
    let filter = {};
    if(id){
        filter['_id'] = id;
    }
    const totalDocs = await FaqModel.countDocuments(filter);
    const skip = (page - 1) * perPage;
    const totalPages = Math.ceil(totalDocs / perPage);
    const pagination = {
        totalPages,
        perPage,
        page,
        totalDocs
    }
    
    const items = await FaqModel.find(filter).sort({createdAt : -1}).skip(skip).limit(perPage);
    return res.json({ data: items, errors: [], filter, success: 1, message: "Fetched Faqs successfully.", pagination });
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