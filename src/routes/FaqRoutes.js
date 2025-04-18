const { Router } = require("express");
const { _create, getAll } = require("../controllers/FaqController");

const router = Router();
router.get('/', getAll);
router.post('/', _create);
module.exports = router;