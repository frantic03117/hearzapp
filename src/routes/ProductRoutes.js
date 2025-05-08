const { Router } = require("express");
const { getProducts, createProduct, deleteProduct } = require("../controllers/ProductController");
const store = require("../middleware/Upload");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', Auth, getProducts);
router.post('/', Auth, store.any(), createProduct);
router.delete('/delete/:id', Auth, deleteProduct);
module.exports = router;