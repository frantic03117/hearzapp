const { Router } = require("express");
const { medicaltests, startTest, updateEarTest } = require("../controllers/MedicalTestController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', medicaltests);
router.post('/', Auth, startTest);
router.put('/ear-update/:id', Auth, updateEarTest);
module.exports = router;