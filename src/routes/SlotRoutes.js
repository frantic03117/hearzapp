const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { create_slot, get_slot, getAllSlots } = require("../controllers/SlotController");

const router = Router();
router.post('/', Auth, create_slot);
router.get('/', get_slot);
router.get('/all', getAllSlots);
module.exports = router;