const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { create_slot, get_slot, mark_holiday, block_slot, unblock_slot } = require("../controllers/SlotController");

const router = Router();
router.post('/', Auth, create_slot);
router.post('/holiday', Auth, mark_holiday);
router.post('/block', Auth, block_slot);
router.post('/un-block', Auth, unblock_slot);
router.get('/', Auth, get_slot);
router.get('/find', get_slot);

module.exports = router;