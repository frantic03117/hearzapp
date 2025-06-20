const PolicyModel = require('../models/Policy');
const _create = async (req, res) => {

    const { policy_id, title, description } = req.body;
    const url = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    try {
        if (policy_id) {
            let fdata = {
                url: url,
                _id: { $ne: policy_id }
            };
            const isExits = await PolicyModel.findOne(fdata);
            if (isExits) {
                return res.json({ errors: [{ title: "Policy already exists for this title." }], data: [], success: 0, message: "Create New Policy failed" });
            }
            const policy = await PolicyModel.findOne({ _id: policy_id });
            if (policy) {
                policy.url = url;
                policy.title = title;
                policy.description = description;
                await policy.save();
                return res.json({ errors: [], data: policy, success: 1, message: "Policy Updated Successfully" });
            }
        } else {
            const isExists = await PolicyModel.findOne({ url: url });
            if (!isExists) {
                const data = new PolicyModel({ title, url, description });
                const savedData = await data.save();
                return res.json({ errors: [], data: savedData, success: 1, message: "Policy Created Successfully" });
            } else {
                return res.json({ errors: [{ title: "Policy already exists for this title." }], data: [], success: 0, message: "Create New Policy failed" });
            }
        }
    } catch (error) {
        return res.status(500).json({ errors: [{ msg: error.message }], success: 0, message: "Server Error" });
    }
};
const get_policies = async (req, res) => {
    const {url, id} = req.query;
    const fdata = {};
    if(url){
        fdata['url'] = url
    }
    if(id){
        fdata['_id'] = id
    }
    const items = await PolicyModel.find({...fdata});
    return res.json({ errors: [], data: items, success: 1, message: "List of Policies" });
}
const get_policy = async (req, res) => {
    const url = req.params.url;
    const items = await PolicyModel.findOne({ url: url });
    return res.json({ errors: [], data: items, success: 1, message: "Policy Data" });

}
const get_policy_by_id = async (req, res) => {
    const id = req.params.id;
    const items = await PolicyModel.findOne({ _id: id });
    return res.json({ errors: [], data: items, success: 1, message: "Policy Data" });
}
const delete_policy = async (req, res)=> {
     const id = req.params.id;
    const items = await PolicyModel.deleteOne({ _id: id });
    return res.json({ errors: [], data: items, success: 1, message: "Policy deleted" });
}
module.exports = {
    _create, get_policies, get_policy, get_policy_by_id, delete_policy
}