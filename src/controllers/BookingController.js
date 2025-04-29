const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const moment = require("moment-timezone");
const User = require("../models/User");

exports.create_booking = async (req, res) => {
    try {
        const userId = req.user._id;
        const fields = ['clinic', 'booking_date', 'slot_id', 'start_at', 'end_at', 'mode'];
        const emptyFields = fields.filter(field => !req.body[field]);
        if (emptyFields.length > 0) {
            return res.json({ success: 0, message: 'The following fields are required:' + emptyFields.join(','), fields: emptyFields });
        }
        const { clinic, booking_date, slot_id, start_at, end_at, mode, language, address } = req.body;
        const findclinic = await User.findOne({ _id: clinic, role: "Clinic" });
        if (!findclinic) {
            return res.json({ success: 0, message: "Clinic not found", data: findclinic });
        }
        const findslot = await Slot.findOne({ _id: slot_id });
        if (!findslot) {
            return res.json({ success: 0, message: "Slot not found", data: findslot });
        }
        const start_at_utc = moment.tz(start_at, "Asia/Kolkata").utc().toDate();
        const end_at_utc = moment.tz(end_at, "Asia/Kolkata").utc().toDate();
        const date_utc = moment.tz(booking_date, "Asia/Kolkata").startOf("day").utc().toDate();
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const parsedDate = new Date(booking_date);
        const weekdayname = weekdays[parsedDate.getDay()];
        const isHoliday = await Slot.findOne({ date: date_utc, clinic: clinic, isHoliday: true, status: "blocked" });
        if (isHoliday) {
            return res.json({ success: 0, message: "This date is marked as holiday for this clinic", data: null });
        }
        const isBlocked = await Slot.findOne({ date: date_utc, clinic: clinic, start_time: findslot.start_time, end_time: findslot.end_time, status: "blocked" });
        if (isBlocked) {
            return res.json({ success: 0, message: "This slot is marked as blocked for this clinic", data: null });
        }
        const isBooked = await Booking.findOne({
            booking_date: date_utc, clinic: clinic, $or: [
                {
                    start_at: { $lt: end_at_utc },
                    end_at: { $gt: start_at_utc }
                }
            ]
        });
        if (isBooked) {
            return res.json({ success: 0, message: 'These slots are already booked  for this clinic', data: null })
        }
        const data = {
            clinic: clinic,
            user: userId,
            booking_date: date_utc,
            duration: (new Date(end_at).getTime() - new Date(start_at).getTime()) / 6000,
            mode: mode,
            start_at: start_at_utc,
            end_at: end_at_utc,
            status: "booked"
        }
        if (language) {
            data['language'] = language;
        }
        if (address) {
            data['address'] = address;
        }
        const resp = await Booking.create(data);
        return res.json({ success: 1, data: resp, message: "Booking created successfully" });
    } catch (err) {
        const stackLine = err.stack?.split("\n")[1]?.trim();
        return res.json({ success: 0, message: err.message, stackLine });
    }
}

exports.get_booking = async (req, res) => {
    const userId = req.user._id;
    const role = req.user.role;
    const { date, page = 1, perPage = 10 } = req.query;
    const fdata = {}
    if (role == "User") {
        fdata['user'] = userId
    }
    if (role == "Clinic") {
        fdata['clinic'] = userId
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