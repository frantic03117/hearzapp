const { Router } = require("express");
const { verify_otp, update_profile, user_list, send_otp, store_profile, admin_login, my_profile } = require("../controllers/UserController");
const store = require("../middleware/Upload");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.post('/send-otp', send_otp);
router.post('/verify-otp', verify_otp);
router.put('/update', Auth, store.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'graduation_certificate', maxCount: 1 },
    { name: 'post_graduation_certificate', maxCount: 1 },
    { name: 'mci_certificate', maxCount: 1 },
    { name: 'aadhaar_front', maxCount: 1 },
    { name: 'aadhaar_back', maxCount: 1 },
    { name: 'pan_image', maxCount: 1 }
]), update_profile);
router.put('/update/:id', Auth, store.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'graduation_certificate', maxCount: 1 },
    { name: 'post_graduation_certificate', maxCount: 1 },
    { name: 'mci_certificate', maxCount: 1 },
    { name: 'aadhaar_front', maxCount: 1 },
    { name: 'aadhaar_back', maxCount: 1 },
    { name: 'pan_image', maxCount: 1 }
]), update_profile);
router.post('/create', store.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'graduation_certificate', maxCount: 1 },
    { name: 'post_graduation_certificate', maxCount: 1 },
    { name: 'mci_certificate', maxCount: 1 },
    { name: 'aadhaar_front', maxCount: 1 },
    { name: 'aadhaar_back', maxCount: 1 },
    { name: 'pan_image', maxCount: 1 }
]), store_profile);
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
router.get('/all', Auth, user_list);
router.post('/auth', admin_login);
router.get('/', Auth, my_profile);



module.exports = router;