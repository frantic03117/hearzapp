const { Router } = require("express");
const { get_all_specialization, _create_specialization, _update_specialization, delete_specialization } = require("../controllers/SpecializationController");
const store = require("../middleware/Upload");

const router = Router();
router.get('/', get_all_specialization);
router.post('/', store.single('icon'), _create_specialization);
router.put('/update/:id', store.single('icon'), _update_specialization);
router.delete('/delete/:id', delete_specialization);
module.exports = router;