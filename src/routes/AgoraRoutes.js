const { Router } = require("express");
const { getAgoraToken } = require("../controllers/AgoraController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.post('/', Auth, getAgoraToken);
module.exports = router;