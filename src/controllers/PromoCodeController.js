const PromoCode = require("../models/PromoCode");

exports.create_promocode = async (req, res) => {
    const fields = ['code', 'short_description', 'minimum_order', 'discount', 'discount_type', 'start_at', 'end_at'];
    const emptyFields = fields.filter(field => !req.body[field]);
    if (emptyFields.length > 0) {
        return res.json({ success: 0, message: 'The following fields are required: ' + emptyFields.join(','), fields: emptyFields });
    }

    const data = { ...req.body };
    const resp = await PromoCode.create(data);
    return res.json({ success: 1, message: "Promo code created successfully", data: resp });

}
exports.get_all_promocodes = async (req, res) => {
    const { code, page = 1, perPage = 10 } = req.query;
    const fdata = {};
    if (code) {
        fdata['code'] = code
    }
    const skip = (page - 1) * perPage;

    const resp = await PromoCode.find(fdata).sort({ createdAt: -1 }).skip(skip).limit(perPage);
    return res.json({ success: 1, message: "All promo codes", data: resp })
}
exports.delete_promocode = async (req, res) => {
    const { id } = req.params;
    const resp = await PromoCode.deleteOne({ _id: id });
    return res.json({ success: 1, data: resp, message: "Deleted successfully" });
}
exports.update_promocode = async (req, res) => {
    const { id } = req.params;
    const fields = ['code', 'short_description', 'minimum_order', 'discount', 'discount_type', 'start_at', 'end_at'];
    const emptyFields = fields.filter(field => !req.body[field]);
    if (emptyFields.length > 0) {
        return res.json({ success: 0, message: 'The following fields are required: ' + emptyFields.join(','), fields: emptyFields });
    }

    const data = { ...req.body };
    const resp = await PromoCode.findOneAndUpdate({ _id: id }, { $set: data });
    return res.json({ success: 1, message: "Promo code created successfully", data: resp });
}