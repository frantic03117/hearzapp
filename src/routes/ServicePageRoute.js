const { Router } = require("express");
const store = require("../middleware/Upload");
const { createPage, addSection, getPages, getcategories } = require("../controllers/ServicePageController");

const router = Router();
router.post('/', store.single('banner'), createPage);
router.post('/add-section/:id', store.single('image'), addSection);
router.get('/', getPages);
router.get('/category', getcategories);
module.exports = router;