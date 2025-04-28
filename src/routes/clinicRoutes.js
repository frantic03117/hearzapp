const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { get_clinics, store_profile } = require("../controllers/ClinicController");
const store = require("../middleware/Upload");

const router = Router();
router.get('/', Auth, get_clinics);
router.post('/register', Auth, store.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'graduation_certificate', maxCount: 1 },
    { name: 'post_graduation_certificate', maxCount: 1 },
    { name: 'mci_certificate', maxCount: 1 },
    { name: 'aadhaar_front', maxCount: 1 },
    { name: 'aadhaar_back', maxCount: 1 },
    { name: 'pan_image', maxCount: 1 }
]), store_profile);
module.exports = router;