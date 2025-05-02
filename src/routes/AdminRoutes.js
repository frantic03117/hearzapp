const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { dashboard } = require("../controllers/AdminController");

const router = Router();
router.get('/dashboard', Auth, dashboard);
module.exports = router;