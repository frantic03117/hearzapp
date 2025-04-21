const { Router } = require("express");
const { getProducts, createProduct, deleteProduct } = require("../controllers/ProductController");
const store = require("../middleware/Upload");

const router = Router();
router.get('/', getProducts);
router.post('/', store.any(), createProduct);
router.delete('/delete/:id', deleteProduct);
module.exports = router;