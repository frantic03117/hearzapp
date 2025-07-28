const { Router } = require("express");
const { create_booking, get_booking, update_payment_status } = require("../controllers/BookingController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.post('/', Auth, create_booking);
router.get('/', Auth, get_booking);
router.get('/update-payment-status/:orderId', update_payment_status);
module.exports = router;