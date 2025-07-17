const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { handle_specility, get_specility, getDoctorWithSpecialization, handleDoctorVerify } = require("../controllers/DoctorController");

const router = Router();
router.post('/specility/:doctor_id', Auth, handle_specility);
router.get('/specility/:doctor_id', Auth, get_specility);
router.get('/', getDoctorWithSpecialization);
router.get('/all', Auth, getDoctorWithSpecialization);
router.put('/handle-verify/:id', Auth, handleDoctorVerify);
module.exports = router;