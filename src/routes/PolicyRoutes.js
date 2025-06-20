const { Router } = require("express");
const { get_policies, _create, delete_policy } = require("../controllers/PolicyController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', get_policies);
router.post('/', _create);
router.delete('/delete/:id', Auth, delete_policy);
module.exports = router;