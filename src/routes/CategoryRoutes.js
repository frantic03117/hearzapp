const { Router } = require("express");
const store = require("../middleware/Upload");
const { create_category, get_categories, delete_categories, update_category } = require("../controllers/CategoryController");

const router = Router();
router.post('/', store.single('icon'), create_category);
router.get('/', get_categories);
router.delete('/delete/:id', delete_categories);
router.put('/update/:id', store.single('icon'), update_category);
module.exports = router;