const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic"
    },
    start_time: { type: Date },
    end_time: { type: Date },
    status: { type: String, enum: ["available", "booked", "blocked"], default: "available" },
    block_type: { type: String, default: null },
    block_at: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Slot = mongoose.model("Slot", slotSchema);

module.exports = Slot;
