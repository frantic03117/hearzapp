const { Router } = require("express");
const { getProducts, createProduct, deleteProduct, updateProduct, activeHandle } = require("../controllers/ProductController");
const store = require("../middleware/Upload");
const { Auth } = require("../middleware/Auth");

const router = Router();
router.get('/', getProducts);
router.post('/handle-active', Auth, activeHandle);
router.post('/', Auth, store.any(), createProduct);
router.put('/update/:id', Auth, store.any(), updateProduct);
router.delete('/delete/:id', Auth, deleteProduct);
module.exports = router;