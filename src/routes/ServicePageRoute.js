const { Router } = require("express");
const store = require("../middleware/Upload");
const { createPage, addSection, getPages, getcategories, deletePage } = require("../controllers/ServicePageController");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.post('/', store.single('banner'), createPage);
router.post('/add-section/:id', store.single('image'), addSection);
router.get('/', getPages);
router.delete('/delete/:id', Auth, deletePage);
router.get('/category', getcategories);
module.exports = router;