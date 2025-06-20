const { Router } = require("express");
const { _create, getAll, destroy, updatefaq } = require("../controllers/FaqController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', getAll);
router.post('/', Auth, _create);
router.put('/update/:_id', Auth, updatefaq);
router.delete('/destroy/:_id', Auth, destroy);
module.exports = router;