const Booking = require("../models/Booking");
const moment = require("moment-timezone");

exports.create_booking = async (req, res) => {
    const userId = req.user._id;
    const { doctor_id, booking_date, start_at, end_at, mode } = req.body;
    const start_at_utc = moment.tz(start_at, "Asia/Kolkata").startOf("day").utc().toDate();
    const end_at_utc = moment.tz(end_at, "Asia/Kolkata").startOf("day").utc().toDate();
    const date_utc = moment.tz(booking_date, "Asia/Kolkata").startOf("day").utc().toDate();
    const data = {
        doctor: doctor_id,
        user: userId,
        booking_date: date_utc,
        duration: (new Date(end_at).getTime() - new Date(end_at).getTime()) / 60000,
        mode: mode,
        start_at: start_at_utc,
        end_at: end_at_utc,
        status: booked
    }
    const resp = await Booking.create(data);
    return res.json({ success: 1, data: resp, message: "Booking created successfully" })
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