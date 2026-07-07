const express = require("express");
const router = express.Router();
const {
    validateCoupon, getActiveCoupons, getAllCoupons,
    createCoupon, deleteCoupon
} = require("../controllers/couponController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.get("/active", getActiveCoupons);
router.post("/validate", protect, validateCoupon);
router.use(protect, authorize("admin"));
router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;