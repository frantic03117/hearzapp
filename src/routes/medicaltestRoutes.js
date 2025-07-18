const { Router } = require("express");
const { medicaltests, startTest, updateEarTest } = require("../controllers/MedicalTestController");

const router = Router();
router.get('/', medicaltests);
router.post('/', startTest);
router.put('/ear-update/:id', updateEarTest);
module.exports = router;