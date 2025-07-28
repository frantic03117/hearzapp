const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    weekdayName: {
        type: String
    },
    date: {
        type: Date
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    slot_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Slot",
        default: null
    },
    start_time: { type: String },
    end_time: { type: String },
    status: {
        type: String,
        enum: ["available", "booked", "blocked"],
        default: "available"
    },
    isHoliday: {
        type: Boolean,
        default: false
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Slot = mongoose.model("Slot", slotSchema);

module.exports = Slot;
