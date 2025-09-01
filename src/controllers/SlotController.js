const Slot = require("../models/Slot");
const moment = require("moment-timezone");
const User = require("../models/User");


exports.create_slot = async (req, res) => {
    try {
        const finduser = await User.findOne({ _id: req.user._id });
        if (!["Clinic", "Doctor"].includes(finduser.role)) {
            return res
                .status(403)
                .json({ success: 0, message: "Only clinic or doctor can add slots" });
        }

        const clinic_id =
            finduser.role === "Clinic" ? finduser._id : finduser.clinic;

        let { date, duration, gap, dayname, doctor, start_time, end_time } =
            req.body;

        if (!doctor && finduser.role === "Doctor") {
            doctor = finduser._id;
        }

        if (!duration || !gap || !dayname || !start_time || !end_time) {
            return res.json({
                success: 0,
                message: "Duration, gap, dayname, start_time, and end_time are required",
                data: null,
            });
        }

        // ✅ Validate dayname
        const weekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        if (!weekdays.includes(dayname)) {
            return res.json({
                success: 0,
                message: "Please enter a correct dayname (e.g., Monday).",
                data: null,
            });
        }

        // ✅ Handle date if provided
        let slotDate = null;
        let weekdayName = dayname;
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate)) {
                return res.json({ success: 0, message: "Invalid date format." });
            }
            weekdayName = weekdays[parsedDate.getDay()];
            slotDate = moment
                .tz(date, "Asia/Kolkata")
                .startOf("day")
                .utc()
                .toDate();
        }

        const durationMins = parseInt(duration, 10);
        const gapMins = parseInt(gap, 10);
        const totalStep = durationMins + gapMins;

        // ✅ Normalize times into IST
        let start = moment
            .tz(start_time, ["HH:mm", moment.ISO_8601], "Asia/Kolkata")
            .clone();
        let end = moment
            .tz(end_time, ["HH:mm", moment.ISO_8601], "Asia/Kolkata")
            .clone();

        if (!start.isBefore(end)) {
            return res.status(400).json({
                success: 0,
                message: "start_time must be before end_time",
            });
        }

        const slotsToSave = [];

        while (start.clone().add(durationMins, "minutes").isSameOrBefore(end)) {
            const slotStart = start.clone();
            const slotEnd = slotStart.clone().add(durationMins, "minutes");

            slotsToSave.push({
                doctor,
                clinic: clinic_id,
                date: slotDate || null,
                weekdayName,
                start_time: slotStart.format("HH:mm"),
                end_time: slotEnd.format("HH:mm"),
                status: "available",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Move forward by duration + gap
            start = slotEnd.clone().add(gapMins, "minutes");
        }

        if (slotsToSave.length === 0) {
            return res.json({
                success: 0,
                message: "No valid slots generated.",
                data: null,
            });
        }

        // ✅ Remove existing overlapping slots for doctor + clinic + day/date
        const deleteFilter = {
            clinic: clinic_id,
            doctor,
            weekdayName,
            date: slotDate || null,
        };
        await Slot.deleteMany(deleteFilter);

        // ✅ Insert new slots
        const savedSlots = await Slot.insertMany(slotsToSave);

        return res.status(201).json({
            success: 1,
            message: "Slots created successfully.",
            total_slots: savedSlots.length,
            data: savedSlots,
        });
    } catch (err) {
        console.error("Error creating slots:", err);
        return res.status(500).json({ success: 0, message: err.message });
    }
};

exports.get_slot = async (req, res) => {
    try {
        // const tdat = "2025-06-13";
        // const thiteen = moment(tdat).tz('Asia/Kolkata').format('YYYY-MM-DD');

        const { dayname, date = new Date(), clinic, doctor } = req.query;
        const fdata = {
            isHoliday: false
        };
        if (req.user) {


            if (req.user.role == "Clinic") {
                fdata['clinic'] = req.user._id
            }
        }
        if (doctor) {
            fdata['doctor'] = doctor;
        }
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        // if (date) {
        //     fdata["date"] = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();

        // }
        if (clinic) {
            fdata["clinic"] = clinic;
        }
        if (dayname) {
            fdata["weekdayName"] = dayname;
        }
        if (!date) {
            return res.json({ success: 0, message: "date not found" });
        }


        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return res.json({ success: 0, data: null, message: "Invalid date format." });
        }
        const utdate = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
        fdata['weekdayName'] = weekdays[parsedDate.getDay()];
        const findholiday = {
            date: utdate,
            isHoliday: true,
            doctor: doctor,
            status: "blocked"
        }

        if (req.user && req.user.role == "Clinic") {
            findholiday['clinic'] = req.user._id;
        }
        if (req.user && req.user.role == "Doctor") {
            findholiday['doctor'] = req.user._id;
        }
        if (clinic) {
            findholiday['clinic'] = clinic
        }

        const isholiday = await Slot.findOne(findholiday);

        if (isholiday) {
            return res.json({ isholiday, data: [], success: 0, message: "Given date is marked as holiday" })
        }
        const findisblocked = {
            date: utdate,
            status: "blocked"
        }
        if (req.user && req.user.role == "Clinic") {
            findisblocked['clinic'] = req.user._id;
        }
        if (req.user && req.user.role == "Doctor") {
            findisblocked['doctor'] = req.user._id;
        }
        if (clinic) {
            findisblocked['clinic'] = clinic
        }
        const blockedSlots = await Slot.find(findisblocked);
        const slots = await Slot.find({ ...fdata, status: "available" }).populate([{
            path: 'clinic',
            select: 'name email mobile profile_image role'
        }, {
            path: 'doctor',
            select: 'name email mobile profile_image role'
        }]).lean().sort({ start_time: 1 });
        // return res.json({ slots });
        const today = moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');

        const formattedSlots = slots.map(slot => {
            const startTime = moment.tz(`${today} ${slot.start_time}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata')
                .format('YYYY-MM-DD HH:mm');
            const endTime = moment.tz(`${today} ${slot.end_time}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata')
                .format('YYYY-MM-DD HH:mm');
            const blockedSlot = blockedSlots.find(
                b => b.start_time === slot.start_time && b.end_time === slot.end_time
            );

            return {
                ...slot,
                date,
                start_time: startTime,
                end_time: endTime,
                fdata,
                status: blockedSlot ? 'blocked' : slot.status || 'available',
                blocked_id: blockedSlot ? blockedSlot._id : null
            };
        });
        return res.json({
            success: 1,
            message: "Available slots fetched successfully",
            data: formattedSlots
        });

    } catch (error) {
        return res.status(500).json({ success: 0, message: "Server error", error: error.message });
    }
};
exports.mark_holiday = async (req, res) => {
    try {
        const clinic_id = req.user._id;
        const findclinic = await User.findOne({ _id: clinic_id, role: "Clinic" });
        if (!findclinic) {
            return res.json({ success: 0, message: "Only clinic can add slots", data: null })
        }
        const { date, doctor } = req.body;
        if (!date) {
            return res.json({ success: 0, message: "date is required", data: null })
        }
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const parsedDate = new Date(date);
        const weekdayname = weekdays[parsedDate.getDay()];
        const blockdata = {
            weekdayName: weekdayname,
            clinic: clinic_id,
            doctor: doctor,
            status: "blocked",
            isHoliday: true,
            date: moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate(),
            createdAt: new Date()
        }
        const isAlreadyBlocked = await Slot.findOne({
            clinic: clinic_id,
            doctor: doctor,
            status: "blocked",
            isHoliday: true,
            date: moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate(),
        });
        let resp;
        if (isAlreadyBlocked) {
            resp = await Slot.findOneAndUpdate({ _id: isAlreadyBlocked._id }, { $set: blockdata });
        } else {
            resp = await Slot.create(blockdata);
        }

        return res.json({ success: 1, message: "holiday added successfully", data: resp });
    } catch (err) {
        return res.json({ success: 1, message: err.message, data: null })
    }
}
exports.block_slot = async (req, res) => {
    try {
        const finduser = await User.findOne({ _id: req.user._id });
        if (!['Clinic', 'Doctor'].includes(finduser.role)) {
            return res.status(403).json({ success: 0, message: "Only clinic can add slots", data: null })
        }
        const clinic_id = finduser.role == "Clinic" ? finduser._id : finduser.clinic;

        const { slot, date } = req.body;
        if (!date) {
            return res.json({ success: 0, message: "date is required", data: null })
        }
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const parsedDate = new Date(date);
        const weekdayname = weekdays[parsedDate.getDay()];
        const findSlot = await Slot.findOne({ _id: slot, clinic: clinic_id, weekdayName: weekdayname });
        if (!findSlot) {
            return res.json({ success: 0, message: "No slot found" });
        }
        const blockdata = {
            weekdayName: weekdayname,
            status: "blocked",
            doctor: findSlot.doctor,
            "clinic": findSlot.clinic,
            date: moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate(),
            start_time: findSlot.start_time,
            end_time: findSlot.end_time,
            createdAt: new Date()
        }
        const findalreadyblocked = await Slot.findOne({
            weekdayName: weekdayname,
            status: "blocked",
            doctor: findSlot.doctor,
            "clinic": findSlot.clinic,
            date: moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate(),
            start_time: findSlot.start_time,
            end_time: findSlot.end_time,
        });
        let resp;
        if (findalreadyblocked) {
            resp = await Slot.findOneAndUpdate({ _id: findalreadyblocked._id }, { $set: blockdata }, { new: true });
        } else {
            resp = await Slot.create(blockdata);
        }
        return res.json({ success: 1, message: "Slot blocked successfully", data: resp });

    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
exports.unblock_slot = async (req, res) => {
    try {
        const { blocked_id } = req.body;
        const resp = await Slot.deleteOne({ _id: blocked_id });
        return res.json({ success: 1, message: "Deleted successfully" })
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }
}
