const { Router } = require("express");
const { get_policies, _create } = require("../controllers/PolicyController");

const router = Router();
router.get('/', get_policies);
router.post('/', _create);
module.exports = router;