const Product = require("../models/Product");
const User = require("../models/User")

exports.dashboard = async (req, res) => {
    try {
        const clinics = await User.countDocuments({ role: "Clinic" });
        const doctors = await User.countDocuments({ role: "Doctor" });
        const users = await User.countDocuments({ role: "User" });
        const products = await Product.countDocuments({ isActive: true });
        const data = {
            clinics, doctors, users, products
        }
        return res.json({ success: 1, data, message: "Dashboard" });
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}