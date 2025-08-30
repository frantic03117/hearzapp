const { Router } = require("express");
const { getVoucher, getVouchers, createVoucher, updateActivation, deleteVoucher, applyVoucher } = require("../controllers/VoucherController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', Auth, getVouchers);
router.post('/', Auth, createVoucher);
router.post('/activation/:id', Auth, updateActivation);
router.post('/apply', Auth, applyVoucher);
router.delete('/delete/:id', Auth, deleteVoucher);
module.exports = router;