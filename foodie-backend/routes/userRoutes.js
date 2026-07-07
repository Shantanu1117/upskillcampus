const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    deleteAccount,
    addAddress,
    updateAddress,
    deleteAddress,
    getAddresses,
    setDefaultAddress,
    getFavouriteRestaurants,
    addFavouriteRestaurant,
    removeFavouriteRestaurant,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getAllUsers,
    getUserById,
    updateUserRole,
    getOrderHistory
} = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// All routes require authentication
router.use(protect);

// ===========================
// PROFILE ROUTES
// ===========================
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.delete("/account", deleteAccount);

// ===========================
// ADDRESS ROUTES
// ===========================
router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);
router.patch("/addresses/:addressId/set-default", setDefaultAddress);

// ===========================
// FAVOURITE RESTAURANTS
// ===========================
router.get("/favourites", getFavouriteRestaurants);
router.post("/favourites/:restaurantId", addFavouriteRestaurant);
router.delete("/favourites/:restaurantId", removeFavouriteRestaurant);

// ===========================
// NOTIFICATIONS
// ===========================
router.get("/notifications", getNotifications);
router.patch("/notifications/:notificationId/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

// ===========================
// ORDER HISTORY
// ===========================
router.get("/order-history", getOrderHistory);

// ===========================
// ADMIN ONLY ROUTES
// ===========================
router.get("/", authorize("admin"), getAllUsers);
router.get("/:userId", authorize("admin"), getUserById);
router.patch("/:userId/role", authorize("admin"), updateUserRole);

module.exports = router;