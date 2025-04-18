const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Booking = require("../models/Booking");
const APP_ID = "379eda36f4594f8497be07fa4eba6a0c";
const APP_CERTIFICATE = "8c65f495efbe4096918873f245541ffc";
exports.getAgoraToken = async (req, res) => {
    try {
        const { booking_id } = req.body;
        const channelName = `appointment_${booking_id}`;
        const uid = req.user._id;
        const role = req.user.role;
        const booking = await Booking.findOne({ _id: booking_id });
        const duration = booking.duration * 60; //seconds
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + duration;
        const rtcRole = role == "Doctor" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            rtcRole,
            privilegeExpiredTs
        );
        const data = { token, uid, channelName, appId: APP_ID };

        res.json({ success: 1, data, message: "Get token" });
    } catch (err) {
        return res.json({ success: 0, message: err.message })
    }

}