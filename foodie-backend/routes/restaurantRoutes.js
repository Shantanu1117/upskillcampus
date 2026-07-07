const express = require("express");
const router = express.Router();
const {
    getAllRestaurants, getRestaurantById,
    createRestaurant, updateRestaurant,
    deleteRestaurant, getNearbyRestaurants,
    toggleRestaurantOpen, getMyRestaurant
} = require("../controllers/restaurantController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.get("/", getAllRestaurants);
router.get("/nearby", getNearbyRestaurants);
router.get("/my", protect, authorize("restaurant_owner"), getMyRestaurant);
router.get("/:id", getRestaurantById);
router.post("/", protect, authorize("restaurant_owner", "admin"), createRestaurant);
router.put("/:id", protect, authorize("restaurant_owner", "admin"), updateRestaurant);
router.delete("/:id", protect, authorize("admin"), deleteRestaurant);
router.patch("/:id/toggle-open", protect, authorize("restaurant_owner"), toggleRestaurantOpen);

module.exports = router;