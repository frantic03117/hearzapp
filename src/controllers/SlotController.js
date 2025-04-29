const Slot = require("../models/Slot");
const moment = require("moment-timezone");
const User = require("../models/User");
exports.create_slot = async (req, res) => {
    try {
        const clinic_id = req.user._id;
        const findclinic = await User.findOne({ _id: clinic_id, role: "Clinic" });
        if (!findclinic) {
            return res.json({ success: 0, message: "Only clinic can add slots", data: null })
        }
        const { date, availability, duration, gap, dayname, doctorId } = req.body;
        if (!duration) {
            return res.json({ success: 0, data: null, message: "Duration is mandatory." });
        }
        if (!gap) {
            return res.json({ success: 0, data: null, message: "Gap is mandatory." });
        }
        if (!dayname) {
            return res.json({ success: 0, data: null, message: "Dayname is mandatory." });
        }
        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            return res.json({ success: 0, data: null, message: "Availability array is mandatory and should not be empty." });
        }
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if (!weekdays.includes(dayname)) {
            return res.json({ success: 0, data: null, message: "Please enter a correct dayname (e.g., Monday)." });
        }
        let slotDate = null;
        let weekdayName = dayname;
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate)) {
                return res.json({ success: 0, data: null, message: "Invalid date format." });
            }
            weekdayName = weekdays[parsedDate.getDay()];
            slotDate = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
        }
        const slotsToSave = [];
        for (const range of availability) {
            let start = moment(range.start_time, "HH:mm");
            const end = moment(range.end_time, "HH:mm");
            while (start.clone().add(duration, 'minutes').isSameOrBefore(end)) {
                const slotStartTime = start.format("HH:mm");
                const slotEndTime = start.clone().add(duration, 'minutes').format("HH:mm");
                const newSlot = {
                    doctor: doctorId || null,
                    clinic: clinic_id,
                    date: slotDate || null, // if provided
                    weekdayName: weekdayName,
                    start_time: slotStartTime, // Save as "HH:mm" string
                    end_time: slotEndTime,
                    status: "available",
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                slotsToSave.push(newSlot);
                start = start.clone().add(duration + gap, 'minutes');
            }
        }
        if (slotsToSave.length > 0) {
            const de_dat = { clinic: clinic_id, weekdayName };
            await Slot.deleteMany(de_dat);
            await Slot.insertMany(slotsToSave);
        }
        return res.status(201).json({
            success: 1,
            message: "Slots created successfully.",
            total_slots: slotsToSave.length,
            data: slotsToSave
        });
    } catch (err) {
        return res.json({ success: 0, message: err.message, data: null })
    }


};
exports.get_slot = async (req, res) => {
    try {
        const { dayname, date, clinic, duration = 30 } = req.query;
        const fdata = {};
        if (req.user.role == "Clinic") {
            fdata['clinic'] = req.user._id
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
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate)) {
                return res.json({ success: 0, data: null, message: "Invalid date format." });
            }
            const utdate = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
            fdata['weekdayName'] = weekdays[parsedDate.getDay()];
            const isholiday = await Slot.findOne({ date: utdate, clinic: req.body.clinic, status: "blocked", isHoliday: true });
            if (isholiday) {
                return res.json({ isholiday, data: [], success: 0, message: "Given date is marked as holiday" })
            }
            const blockedSlots = await Slot.find({ date: utdate, clinic: req.body.clinic, status: "blocked" });

            if (blockedSlots.length > 0) {
                const btimes = blockedSlots.map(itm => itm.start_time);
                fdata['start_time'] = { $nin: btimes }
            }
        }

        const slots = await Slot.find(fdata).populate({
            path: 'clinic',
            select: 'name email mobile profile_image role'
        }).lean().sort({ start_time: 1 });
        const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
        const formattedSlots = slots.map(slot => ({
            ...slot,
            start_time: moment.utc(today + " " + slot.start_time).format("YYYY-MM-DD HH:mm"),
            end_time: moment.utc(today + " " + slot.end_time).format("YYYY-MM-DD HH:mm")
        }));
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
        const { date } = req.body;
        if (!date) {
            return res.json({ success: 0, message: "date is required", data: null })
        }
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const parsedDate = new Date(date);
        const weekdayname = weekdays[parsedDate.getDay()];
        const blockdata = {
            weekdayName: weekdayname,
            clinic: clinic_id,
            status: "blocked",
            isHoliday: true,
            date: moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate(),
            createdAt: new Date()
        }
        const isAlreadyBlocked = await Slot.findOne({
            clinic: clinic_id,
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
        const clinic_id = req.user._id;
        const findclinic = await User.findOne({ _id: clinic_id, role: "Clinic" });
        if (!findclinic) {
            return res.json({ success: 0, message: "Only clinic can add slots", data: null })
        }
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
            "clinic": findclinic._id,
            date: moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate(),
            start_time: findSlot.start_time,
            end_time: findSlot.end_time,
            createdAt: new Date()
        }
        const findalreadyblocked = await Slot.findOne({
            weekdayName: weekdayname,
            status: "blocked",
            "clinic": findclinic._id,
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
