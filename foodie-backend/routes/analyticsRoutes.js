const express = require("express");
const router = express.Router();
const {
    getAdminDashboard,
    getRestaurantDashboard
} = require("../controllers/analyticsController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);

router.get(
    "/admin/dashboard",
    authorize("admin"),
    getAdminDashboard
);

router.get(
    "/restaurant/:restaurantId/dashboard",
    authorize("restaurant_owner", "admin"),
    getRestaurantDashboard
);

module.exports = router;