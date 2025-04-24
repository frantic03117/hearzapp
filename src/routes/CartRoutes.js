const { Router } = require("express");
const { Auth } = require("../middleware/Auth");
const { getCartItems, addToCart, updateCartItem, removeFromCart } = require("../controllers/cartController");

const router = Router();
router.get('/', Auth, getCartItems);
router.post('/', Auth, addToCart);
router.put('/update/:id', Auth, updateCartItem);
router.put('/delete/:id', Auth, removeFromCart);
module.exports = router;