const { Router } = require("express");
const { getall, _create, update_banner, delete_banner } = require("../controllers/BannerController");
const { Auth } = require("../middleware/Auth");
const store = require("../middleware/Upload");

const router = Router();
router.get('/', getall);
router.post('/', Auth, store.single('image'), _create);
router.put('/update/:id', Auth, update_banner);
router.delete('/delete/:id', Auth, delete_banner);
module.exports = router;
