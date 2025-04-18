const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date }, // Stores only the date
    start_time: { type: Date }, // Start time of each 30-min slot
    end_time: { type: Date }, // End time of each 30-min slot
    status: { type: String, enum: ["available", "booked", "blocked"], default: "available" },
    slot_type: { type: String, default: "Available" },
    block_type: { type: String, default: null },
    block_at: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Slot = mongoose.model("Slot", slotSchema);

module.exports = Slot;
