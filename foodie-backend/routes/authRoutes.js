const express = require("express");
const router = express.Router();
const {
    signup, login, logout, refreshToken,
    verifyEmail, forgotPassword, resetPassword, getMe
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
console.log("✅ authRoutes loaded");
module.exports = router;