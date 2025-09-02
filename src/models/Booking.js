const { Schema, model } = require("mongoose");
const counterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = model("Counter", counterSchema);
const bookingSchema = new Schema({
    request_id: {
        type: Number
    },
    manual_booking_id: {
        type: String
    },
    booking_id: {
        type: String
    },
    bill_no: {
        type: String
    },
    service: {
        type: Schema.Types.ObjectId,
        ref: "Setting",
        default: null
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    booking_date: {
        type: Date,
    },
    duration: {
        type: Number
    },
    mode: {
        type: String,
        enum: ['Home', 'Clinic', 'Online'],
        default: "Clinic"
    },
    clinic: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    booked_slot: {
        type: Schema.Types.ObjectId,
        ref: "Slot",
        default: null
    },
    language: {
        type: String
    },
    start_at: {
        type: Date,
    },
    end_at: {
        type: Date,
    },
    status: {
        type: String
    },
    address: {
        type: String,
    },
    gateway_order_id: { type: String },
    payment_gateway_request: {
        type: Schema.Types.Mixed,
        default: null
    },
    payment_gateway_response: {
        type: Schema.Types.Mixed,
        default: null
    },
    payment_status: {
        type: String,
        default: "Pending"
    }
}, { timestamps: true });
bookingSchema.pre("save", async function (next) {
    if (!this.booking_id) {
        // Atomically increment counter
        const counter = await Counter.findByIdAndUpdate(
            { _id: "booking_id" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.booking_id = counter.seq;
    }

    // Set manual_booking_id
    if (!this.manual_booking_id && this.booking_id) {
        this.manual_booking_id = `SH000${this.booking_id}`;
    }

    // Generate bill_no if not set
    if (!this.bill_no) {
        const now = new Date();
        const year = now.getFullYear();
        const nextYear = year + 1;
        const prefix = `${year.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;

        const lastBooking = await this.constructor
            .findOne({ bill_no: new RegExp(`^${prefix}/`) })
            .sort({ bill_no: -1 })
            .exec();

        let nextNumber = 1;
        if (lastBooking && lastBooking.bill_no) {
            const parts = lastBooking.bill_no.split("/");
            nextNumber = parseInt(parts[1]) + 1;
        }

        this.bill_no = `${prefix}/${nextNumber}`;
    }

    next();
});

module.exports = model('Booking', bookingSchema); // Removed "new"
