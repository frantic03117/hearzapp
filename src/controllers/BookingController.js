const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const moment = require("moment-timezone");

exports.create_booking = async (req, res) => {
    const userId = req.user._id;
    const { doctor_id, slot_ids, duration } = req.body;
    if (![30, 60].includes(duration)) {
        return res.json({ success: 0, message: "Invalid duration. Only 30 or 60 minutes allowed." });
    }
    const slots = await Slot.find({ _id: { $in: slot_ids }, doctor: doctor_id, status: "available" })
        .sort({ start_time: 1 }) // Sort to ensure sequential order
        .lean();
    if (slots.length !== slot_ids.length) {
        return res.json({ success: 0, message: "Some slots are already booked or invalid." });
    }
    for (let i = 1; i < slots.length; i++) {
        const prevSlotEnd = moment.utc(slots[i - 1].end_time);
        const currentSlotStart = moment.utc(slots[i].start_time);
        if (!prevSlotEnd.isSame(currentSlotStart)) {
            return res.status(400).json({ success: 0, message: "Slots must be consecutive with no gaps." });
        }
    }
    const expectedSlotCount = duration == 30 ? 1 : 2;
    if (slots.length !== expectedSlotCount) {
        return res.json({ success: 0, message: `For ${duration}-minute booking, select ${expectedSlotCount} consecutive slot(s).` });
    }
    const booking = await Booking.create({
        user: userId,
        doctor: doctor_id,
        slots: slot_ids,
        booking_date: moment.tz(slots[0].start_time, "Asia/Kolkata").startOf("day").utc().toDate(),
        start_time: slots[0].start_time,
        end_time: slots[slots.length - 1].end_time,
        duration,
        status: "booked"
    });
    await Slot.updateMany({ _id: { $in: slot_ids } }, { $set: { status: "booked" } });
    return res.json({ success: 1, message: "Booking successful", data: booking });

}
exports.get_booking = async (req, res) => {
    const userId = req.user._id;
    const role = req.user.role;
    const { date, page = 1, perPage = 10 } = req.query;
    const fdata = {}
    if (role == "User") {
        fdata['user'] = userId
    }
    if (role == "Doctor") {
        fdata['doctor'] = userId
    }
    if (date) {
        fdata["date"] = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
    }
    const totalDocs = await Booking.countDocuments(fdata);
    const totalPages = Math.ceil(totalDocs / perPage);
    const skip = (page - 1) * perPage;
    let bookings = await Booking.find(fdata).populate({
        path: 'doctor',
        select: 'custom_request_id name mobile gender dob address role profile_image profession'
    }).populate({
        path: "user",
        select: 'custom_request_id name mobile gender dob address role profile_image'
    }).populate({
        path: 'slots',
        select: 'date start_time end_time status'
    }).sort({ booking_date: -1 }).skip(skip).limit(perPage).lean();

    bookings = bookings.map(booking => ({
        ...booking,
        booking_date: booking.booking_date,
        slots: booking.slots.map(slot => ({
            ...slot,
            start_time: moment.utc(slot.start_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            end_time: moment.utc(slot.end_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            date: moment.utc(slot.date).tz("Asia/Kolkata").format("YYYY-MM-DD")
        }))
    }));
    const pagination = { perPage, page, totalPages, totalDocs };
    return res.json({ success: 1, message: "List of bookings", data: bookings, pagination });
}