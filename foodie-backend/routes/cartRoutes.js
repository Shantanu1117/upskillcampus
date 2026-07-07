const express = require("express");
const router = express.Router();
const {
    getCart, addToCart, updateCartItem,
    removeFromCart, clearCart
} = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);
router.use(authorize("customer"));

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove/:menuItemId", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;