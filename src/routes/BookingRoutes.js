const { Router } = require("express");
const { create_booking, get_booking } = require("../controllers/BookingController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.post('/', Auth, create_booking);
router.get('/', Auth, get_booking);
module.exports = router;