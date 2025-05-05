const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { create_order, apply_promocode, get_orders } = require("../controllers/OrderController");

const router = Router();
router.post('/', Auth, create_order);
router.get('/', Auth, get_orders);
router.post('/apply-promo', Auth, apply_promocode);
module.exports = router;