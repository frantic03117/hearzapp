const Slot = require("../models/Slot");
const moment = require("moment-timezone");
const User = require("../models/User");
exports.create_slot = async (req, res) => {
    try {

        const finduser = await User.findOne({ _id: req.user._id, });
        if (!['Clinic', 'Doctor'].includes(finduser.role)) {
            return res.status(403).json({ success: 0, message: "Only clinic can add slots", data: null })
        }
        const clinic_id = finduser.role == "Clinic" ? finduser._id : finduser.clinic;

        // if (!findclinic) {
        //     return res.json({ success: 0, message: "Only clinic can add slots", data: null })
        // }
        let { date, duration, gap, dayname, doctor } = req.body;
        if (!doctor) {
            if (finduser.role == "Doctor") {
                doctor = finduser._id
            }
        }
        if (!duration) {
            return res.json({ success: 0, data: null, message: "Duration is mandatory." });
        }
        if (!gap) {
            return res.json({ success: 0, data: null, message: "Gap is mandatory." });
        }
        if (!dayname) {
            return res.json({ success: 0, data: null, message: "Dayname is mandatory." });
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
        const stime = req.body.start_time;
        const etime = req.body.end_time;
        const durationMins = parseInt(req.body.duration, 10);
        const gapMins = parseInt(req.body.gap, 10);
        const totalSlotStep = durationMins + gapMins;
        let start = moment(stime, "HH:mm");
        const end = moment(etime, "HH:mm");
        while (start.clone().add(durationMins, 'minutes').isSameOrBefore(end)) {
            const slotStartTime = start.format("HH:mm");
            const slotEndTime = start.clone().add(durationMins, 'minutes').format("HH:mm");

            const newSlot = {
                doctor: doctor,
                clinic: clinic_id,
                date: slotDate || null,
                weekdayName: weekdayName,
                start_time: slotStartTime,
                end_time: slotEndTime,
                status: "available",
                createdAt: new Date(),
                updatedAt: new Date()
            };
            slotsToSave.push(newSlot);
            start = start.clone().add(totalSlotStep, 'minutes');
        }

        if (slotsToSave.length > 0) {
            const de_dat = { clinic: clinic_id, weekdayName, doctor: doctor, date: null };
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
