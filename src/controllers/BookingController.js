const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const moment = require("moment-timezone");
const User = require("../models/User");


exports.create_booking = async (req, res) => {
    const userId = req.user._id;
    const { clinic_id, doctor_id, slot_id, booking_date } = req.body;
    const slots = await Slot.findOne({ _id: slot_id, clinic: clinic_id, doctor: doctor_id, status: "available" })
        .lean();
    const bookinguser = await User.findOne({ _id: userId, role: "User" });
    if (!bookinguser) {
        return res.json({ success: 0, message: "User is not registered with us. Please register first." });
    }
    const finddoctor = await User.findOne({ _id: doctor_id, clinic: clinic_id, role: "Doctor" });
    if (!finddoctor) {
        return res.json({ success: 0, message: "Doctor not found" });
    }
    if (!slots) {
        return res.status(400).json({ success: 0, message: "Slot not available or already booked" });
    }
    const isBlocked = await Slot.findOne({ slot_id: slot_id, date: moment.tz(booking_date, "Asia/Kolkata").startOf("day").utc().toDate() });
    if (isBlocked) {
        return res.json({ success: 0, data: [], message: "This slot is already booked" });
    }

    // Extract the time part from slot and apply it to the booking_date
    const slotStart = moment(`${booking_date} ${slots.start_time}`).tz("Asia/Kolkata").format("HH:mm");
    const slotEnd = moment(`${booking_date} ${slots.end_time}`).tz("Asia/Kolkata").format("HH:mm");
    const start_at = moment.tz(`${booking_date} ${slotStart}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata").utc().toDate();
    const end_at = moment.tz(`${booking_date} ${slotEnd}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata").utc().toDate();
    // return res.json({ start_at, end_at });
    const consult_amount = finddoctor?.consultation_charge ?? 2000;
    const bdata = {
        clinic: clinic_id,
        mode: req.body.mode ?? "Online",
        user: userId,
        doctor: doctor_id,
        booking_date: moment.tz(booking_date, "Asia/Kolkata").startOf("day").utc().toDate(),
        start_at,
        end_at,
        consultation_charge: consult_amount,
        duration: (end_at.getTime() - start_at.getTime()) / 60000,
        status: "pending"
    };
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const parsedDate = new Date(booking_date);
    const weekdayname = weekdays[parsedDate.getDay()];

    const blockdata = {
        clinic: clinic_id,
        weekdayName: weekdayname,
        status: "blocked",
        "doctor": doctor_id,
        "slot_id": slots._id,
        date: moment.tz(booking_date, "Asia/Kolkata").startOf("day").utc().toDate(),
        start_time: slots.start_time,
        end_time: slots.end_time,
        createdAt: new Date()
    }
    // console.log(bdata);
    // return res.json({ bdata });
    const blockedSlot = await Slot.create(blockdata);
    bdata['booked_slot'] = blockedSlot._id;
    const booking = await Booking.create(bdata);
    const booking_id = booking._id;
    const payment_data = {
        amount: parseFloat(consult_amount) * 100,
        currency: "INR",
        receipt: booking_id
    }
    await razorpay_instance.orders.create(payment_data, async function (err, order) {
        const order_id = order.id;
        const udata = {
            order_id: order_id,
            payment_gateway_request: order
        }
        const options = {
            key: keyid,
            amount: consult_amount, // Amount in paise
            currency: "INR",
            name: "Soft Hear Hearing Aid Clinic",
            description: "Create Appointment",
            order_id: order_id,
            // handler: (response) => {
            //     console.log(response);
            //     alert("Payment Successful!");
            // },
            prefill: {
                name: bookinguser.name,
                email: bookinguser.email,
                contact: bookinguser.mobile,
            },
            theme: {
                color: "#F37254",
            },
        };
        const updatedbooking = await Booking.findOneAndUpdate({ _id: booking_id }, { $set: udata }, { new: true });
        return res.json({ success: 1, message: "Booking successful", data: updatedbooking, options });
    });
};


exports.get_booking = async (req, res) => {
    try {
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
            path: 'clinic',
            select: 'custom_request_id name mobile  address role profile_image'
        }).populate({
            path: "user",
            select: 'custom_request_id name mobile gender dob address role profile_image'
        }).sort({ booking_date: -1 }).skip(skip).limit(perPage).lean();
        bookings = bookings.map(booking => ({
            ...booking,
            start_at: moment.utc(booking.start_at).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            end_at: moment.utc(booking.end_at).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            booking_date: moment.utc(booking.date).tz("Asia/Kolkata").format("YYYY-MM-DD")
        }));
        const pagination = { perPage, page, totalPages, totalDocs };
        return res.json({ success: 1, message: "List of bookings", data: bookings, pagination });
    } catch (err) {
        const stiackLink = err.stack?.split("\n")[1]?.trim();
        return res.json({ success: 0, message: err.message, stackLine: stiackLink })
    }
}

