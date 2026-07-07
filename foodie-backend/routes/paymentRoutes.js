const express = require("express");
const router = express.Router();
const {
    createPaymentOrder, verifyPayment,
    handleWebhook, processRefund
} = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.post("/webhook", handleWebhook); // No auth - Razorpay calls this
router.use(protect);
router.post("/create-order", authorize("customer"), createPaymentOrder);
router.post("/verify", authorize("customer"), verifyPayment);
router.post("/refund", authorize("admin"), processRefund);

module.exports = router;