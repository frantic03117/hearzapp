const { Router } = require("express");
const { getKeys, createKey, deleteKey, updateKey } = require("../controllers/VariantKeyController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', getKeys);
router.post('/', Auth, createKey);
router.delete('/delete/:id', Auth, deleteKey);
router.put('/update/:id', Auth, updateKey);
module.exports = router;