
const mongoose = require("mongoose");
const Voucher = require("../models/Voucher");
const Booking = require("../models/Booking");
const User = require("../models/User");

// Helper to handle errors
const handleError = (res, error, status = 400) => {
    return res.status(status).json({
        success: 0,
        message: error.message || "Something went wrong",
        errors: error.errors || null,
    });
};

// 📌 Create Voucher
exports.createVoucher = async (req, res) => {
    try {
        if (req.user.role != "Admin") {
            return resstatus(400).json({ success: 0 });
        }
        const { code, uses_count_per_user, discount_type, discount, discount_max_cap, valid_from, valid_to, therapist } = req.body;

        // Basic validations
        if (!code) return res.status(400).json({ success: 0, message: "Code is required" });
        if (!discount_max_cap) return res.status(400).json({ success: 0, message: "discount_max_cap is required" });
        if (!discount_type) return res.status(400).json({ success: 0, message: "Discount type is required" });
        if (!discount) return res.status(400).json({ success: 0, message: "Discount value is required" });
        if (!valid_from || !valid_to) return res.status(400).json({ success: 0, message: "Valid from & valid to dates are required" });

        if (new Date(valid_from) > new Date(valid_to)) {
            return res.status(400).json({ success: 0, message: "valid_from cannot be later than valid_to" });
        }

        const voucher = new Voucher({
            code,
            uses_count_per_user,
            discount_type,
            discount,
            discount_max_cap,
            valid_from,
            valid_to,
            therapist: therapist || null,
        });

        await voucher.save();
        return res.status(201).json({ success: 1, message: "Voucher created successfully", data: voucher });
    } catch (error) {
        return handleError(res, error, 500);
    }
};

// 📌 Get All Vouchers
exports.getVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find().populate("therapist", "name email");
        return res.json({ success: 1, data: vouchers });
    } catch (error) {
        return handleError(res, error, 500);
    }
};

// 📌 Get Single Voucher
exports.getVoucher = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: 0, message: "Invalid ID" });
        }

        const voucher = await Voucher.findById(req.params.id).populate("therapist", "name email");
        if (!voucher) return res.status(404).json({ success: 0, message: "Voucher not found" });

        return res.json({ success: 1, data: voucher });
    } catch (error) {
        return handleError(res, error, 500);
    }
};

// 📌 Update Voucher
exports.updateVoucher = async (req, res) => {
    try {
        if (req.user.role != "Admin") {
            return resstatus(400).json({ success: 0 });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: 0, message: "Invalid ID" });
        }

        const { valid_from, valid_to } = req.body;
        if (valid_from && valid_to && new Date(valid_from) > new Date(valid_to)) {
            return res.status(400).json({ success: 0, message: "valid_from cannot be later than valid_to" });
        }

        const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!voucher) return res.status(404).json({ success: 0, message: "Voucher not found" });

        return res.json({ success: 1, message: "Voucher updated successfully", data: voucher });
    } catch (error) {
        return handleError(res, error, 500);
    }
};

// 📌 Delete Voucher
exports.deleteVoucher = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: 0, message: "Invalid ID" });
        }

        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) return res.status(404).json({ success: 0, message: "Voucher not found" });

        return res.json({ success: 1, message: "Voucher deleted successfully" });
    } catch (error) {
        return handleError(res, error, 500);
    }
};

exports.updateActivation = async (req, res) => {
    try {
        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: 0, message: "Invalid ID" });
        }


        const voucher = await Voucher.findById(id);
        if (!voucher) {
            return res.status(404).json({ success: 0, message: "Voucher not found" });
        }

        voucher.is_active = !voucher.is_active;
        await voucher.save();

        return res.json({
            success: 1,
            message: `Voucher ${voucher.is_active ? "enabled" : "disabled"} successfully`,
            data: voucher,
        });
    } catch (error) {
        return handleError(res, error, 500);
    }
};
exports.applyVoucher = async (req, res) => {
    try {
        const { expert_id, voucherCode, mode } = req.body;
        // user can also come from req.user if you use auth middleware
        const userid = req.user._id;
        // 1. Find booking
        let voucherapp = {}

        const findExpert = await User.findOne({ _id: expert_id, role: "Doctor" });
        if (!findExpert) {
            return res.json({ success: 0, message: "Expert not found" });
        }
        if (!mode) {
            return res.json({ success: 0, message: "Mode not found" });
        }
        const totalAmount = mode == "Online" ? findExpert?.consultation_charge : findExpert?.consultation_charge_offline;
        // 2. Find voucher
        const voucher = await Voucher.findOne({ code: voucherCode });
        if (!voucher) {
            return res.status(404).json({ success: 0, message: "Invalid voucher code" });
        }

        // 3. Voucher validations
        if (!voucher.is_active) {
            return res.status(400).json({ success: 0, message: "Voucher is not active" });
        }

        const now = new Date();
        if (voucher.valid_from && now < voucher.valid_from) {
            return res.status(400).json({ success: 0, message: "Voucher not valid yet" });
        }
        if (voucher.valid_to && now > voucher.valid_to) {
            return res.status(400).json({ success: 0, message: "Voucher expired" });
        }

        // check usage count for this user
        const pastBookings = await Booking.countDocuments({
            "voucher.code": voucher.code,
            "status": { $nin: ['pending', 'Cancelled', 'pending'] }
        });
        if (pastBookings >= voucher.uses_count_per_user) {
            return res.status(400).json({
                success: 0,
                message: "Voucher usage limit reached for this user",
            });
        }

        // 4. Calculate discount
        let discountValue = 0;
        if (voucher.discount_type === "Percent") {
            discountValue = (totalAmount * voucher.discount) / 100;
        } else if (voucher.discount_type === "Fixed") {
            discountValue = voucher.discount;
        }
        if (voucher.discount_max_cap && discountValue > voucher.discount_max_cap) {
            discountValue = voucher.discount_max_cap;
        }


        // 5. Update booking with voucher info
        voucherapp = {
            id: voucher._id,
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount: voucher.discount,
            mode: mode,
            totalAmount: totalAmount,
            discount_max_cap: voucher.discount_max_cap,
            discount_voucher: discountValue
        };




        return res.json({
            success: 1,
            message: "Voucher applied successfully",
            data: voucherapp,
        });
    } catch (error) {
        console.error("Apply voucher error:", error);
        return res.status(500).json({ success: 0, message: "Server error", error });
    }
};