const express = require("express");
const router = express.Router();
const {
    createOrder, getMyOrders, getOrderById,
    updateOrderStatus, getRestaurantOrders, cancelOrder
} = require("../controllers/orderController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);

router.post("/", authorize("customer"), createOrder);
router.get("/my", authorize("customer"), getMyOrders);
router.get("/restaurant/:restaurantId", authorize("restaurant_owner", "admin"), getRestaurantOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", authorize("restaurant_owner", "delivery_driver", "admin"), updateOrderStatus);
router.post("/:id/cancel", authorize("customer"), cancelOrder);

module.exports = router;