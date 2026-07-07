const express = require("express");
const router = express.Router();
const { createReview, getRestaurantReviews } = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.get("/restaurant/:restaurantId", getRestaurantReviews);
router.post("/", protect, authorize("customer"), createReview);

module.exports = router;