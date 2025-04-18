const Slot = require("../models/Slot");
const moment = require("moment-timezone");
exports.create_slot = async (req, res) => {
    const doctorId = req.user._id;
    const { date, availability, slot_type, block_type, block_at } = req.body;

    // Ensure date is in IST and converted to UTC
    const slotDate = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();

    // Function to generate 30-minute slots
    const generateTimeSlots = (date, start, end) => {
        let slots = [];
        let startTime = moment.tz(`${date} ${start}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata").utc();
        let endTime = moment.tz(`${date} ${end}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata").utc();

        while (startTime.isBefore(endTime)) {
            let slotEndTime = startTime.clone().add(30, "minutes");
            slots.push({
                doctor: doctorId,
                date: slotDate,
                start_time: startTime.toDate(),
                end_time: slotEndTime.toDate(),
                status: "available",
                slot_type,
                block_type,
                block_at: block_at ? moment.tz(block_at, "Asia/Kolkata").utc().toDate() : null
            });
            startTime = slotEndTime;
        }
        return slots;
    };

    let slotsToSave = [];

    // Loop through availability to generate slots for each time range
    availability.forEach(slot => {
        slotsToSave.push(...generateTimeSlots(date, slot.start_time, slot.end_time));
    });

    // **Find existing slots for the same doctor and date**
    const existingSlots = await Slot.find({ doctor: doctorId, date: slotDate });

    if (existingSlots.length > 0) {
        // **Update existing slots**
        await Slot.deleteMany({ doctor: doctorId, date: slotDate }); // Remove old slots
        await Slot.insertMany(slotsToSave); // Insert new slots
        return res.json({ success: 1, message: "Slots updated successfully", data: slotsToSave });
    } else {
        // **Insert new slots**
        const resp = await Slot.insertMany(slotsToSave);
        return res.json({ success: 1, message: "Slots created successfully", data: resp });
    }
};

// exports.get_slot = async (req, res) => {
//     const { date, doctor_id } = req.query;
//     const fdata = {};

//     if (date) {
//         fdata['date'] = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
//     }

//     if (req.user && req.user.role === "Doctor") {
//         fdata['doctor'] = req.user._id;
//     }

//     if (doctor_id) {
//         fdata['doctor'] = doctor_id;
//     }

//     const slots = await Slot.find(fdata).lean(); // Fetch plain objects

//     // Group slots based on session times
//     const groupedSlots = {
//         morning: [],
//         afternoon: [],
//         evening: []
//     };
//     const formattedSlots = slots.map(slot => ({
//         ...slot,
//         start_time: moment.utc(slot.start_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
//         end_time: moment.utc(slot.end_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
//         status: slot.status
//     }));
//     slots.forEach(slot => {
//         const startIST = moment.utc(slot.start_time).tz("Asia/Kolkata");
//         const endIST = moment.utc(slot.end_time).tz("Asia/Kolkata");

//         const slotData = {
//             ...slot,
//             start_time: startIST.format("YYYY-MM-DD HH:mm:ss"),
//             end_time: endIST.format("YYYY-MM-DD HH:mm:ss"),
//             status: slot.status
//         };

//         // Categorize into morning, afternoon, and evening
//         const hour = startIST.hour();
//         if (hour >= 8 && hour < 12) {
//             groupedSlots.morning.push(slotData);
//         } else if (hour >= 12 && hour < 17) {
//             groupedSlots.afternoon.push(slotData);
//         } else if (hour >= 17 && hour < 22) {
//             groupedSlots.evening.push(slotData);
//         }
//     });

//     return res.json({
//         success: 1,
//         message: "Available slots fetched successfully",
//         groupdata: groupedSlots,
//         data: formattedSlots
//     });
// };

exports.get_slot = async (req, res) => {
    try {
        const { date, doctor_id, duration = 30 } = req.query;
        const fdata = {};
        if (date) {
            fdata["date"] = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
        }
        if (doctor_id) {
            fdata["doctor"] = doctor_id;
        }
        const slots = await Slot.find(fdata).lean().sort({ start_time: 1 }); // Sort slots by start time
        const formattedSlots = [];
        let i = 0;
        while (i < slots.length) {
            const currentSlot = slots[i];
            const nextSlot = slots[i + 1];
            const startIST = moment.utc(currentSlot.start_time).tz("Asia/Kolkata");
            const endIST = moment.utc(currentSlot.end_time).tz("Asia/Kolkata");
            if (currentSlot.status != "available") {
                i++;
                continue;
            }
            if (duration == 60 && nextSlot) {
                const nextStartIST = moment.utc(nextSlot.start_time).tz("Asia/Kolkata");

                // Check if next slot starts immediately after the current slot
                if (endIST.isSame(nextStartIST) && nextSlot.status == "available") {
                    formattedSlots.push({
                        _id: `${currentSlot._id}-${nextSlot._id}`, // Combine slot IDs
                        start_time: startIST.format("YYYY-MM-DD HH:mm:ss"),
                        end_time: moment.utc(nextSlot.end_time).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
                        status: "available",
                        duration: moment(nextSlot.end_time, "YYYY-MM-DD HH:mm:ss").diff(moment(startIST, "YYYY-MM-DD HH:mm:ss"), 'hours')
                    });

                    i += 2; // Skip next slot since it's merged
                    continue;
                }
            }
            if (duration == 30) {
                formattedSlots.push({
                    _id: currentSlot._id,
                    start_time: startIST.format("YYYY-MM-DD HH:mm:ss"),
                    end_time: endIST.format("YYYY-MM-DD HH:mm:ss"),
                    status: "available"
                });
            }

            i++;
        }

        return res.json({
            success: 1,
            message: "Available slots fetched successfully",
            data: formattedSlots
        });

    } catch (error) {
        return res.status(500).json({ success: 0, message: "Server error", error: error.message });
    }
};
exports.getAllSlots = async (req, res) => {
    const { date, doctor_id, duration = 30 } = req.query;
    const fdata = {};
    if (date) {
        fdata["date"] = moment.tz(date, "Asia/Kolkata").startOf("day").utc().toDate();
    } else {
        const today = new Date();
        fdata["date"] = { $gte: today };
    }
    if (doctor_id) {
        fdata["doctor"] = doctor_id;
    }


    const resp = await Slot.find(fdata).populate({
        path: "doctor",
        select: "name profile_image mobile role"
    })
    return res.json({ success: 1, message: "List of slots", data: resp });
}