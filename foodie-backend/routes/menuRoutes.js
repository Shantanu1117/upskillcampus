const express = require("express");
const router = express.Router();
const {
    getMenuByRestaurant, addMenuItem,
    updateMenuItem, deleteMenuItem
} = require("../controllers/menuController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.get("/restaurant/:restaurantId", getMenuByRestaurant);
router.use(protect);
router.post("/", authorize("restaurant_owner", "admin"), addMenuItem);
router.put("/:id", authorize("restaurant_owner", "admin"), updateMenuItem);
router.delete("/:id", authorize("restaurant_owner", "admin"), deleteMenuItem);

module.exports = router;