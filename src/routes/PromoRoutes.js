const { Router } = require("express");
const { get_all_promocodes, create_promocode, update_promocode, delete_promocode } = require("../controllers/PromoCodeController");

const router = Router();
router.get('/', get_all_promocodes);
router.post('/', create_promocode);
router.put('/update/:id', update_promocode);
router.delete('/delete/:id', delete_promocode);
module.exports = router;