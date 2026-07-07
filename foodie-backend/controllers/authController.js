const User = require("../models/User");
const { 
    generateAccessToken, 
    generateRefreshToken, 
    generateEmailToken,
    verifyRefreshToken,
    verifyAccessToken
} = require("../utils/jwtUtils");
const { 
    sendVerificationEmail, 
    sendPasswordResetEmail,
    sendWelcomeEmail
} = require("../utils/emailUtils");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const crypto = require("crypto");

// POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        if (!name || !email || !password) {
            return sendError(res, 400, "Name, email, and password are required");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendError(res, 400, "Email already registered");
        }

        const allowedRoles = ["customer", "restaurant_owner", "delivery_driver"];
        const userRole = allowedRoles.includes(role) ? role : "customer";

        const user = new User({ name, email, phone, password, role: userRole });

        // Generate email verification token
        const emailToken = generateEmailToken(user._id);
        user.emailVerificationToken = emailToken;

        await user.save();

        // Send verification email (don't block if fails)
        try {
            await sendVerificationEmail(email, name, emailToken);
        } catch (emailErr) {
            console.error("Email send failed:", emailErr.message);
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return sendSuccess(res, 201, "Account created successfully", {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error("Signup error:", error);
        return sendError(res, 500, error.message);
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, "Email and password are required");
        }

        const user = await User.findOne({ email }).select("+password +refreshToken");
        if (!user) {
            return sendError(res, 401, "Invalid email or password");
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return sendError(res, 401, "Invalid email or password");
        }

        if (!user.isActive) {
            return sendError(res, 401, "Account has been deactivated");
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        return sendSuccess(res, 200, "Login successful", {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                avatar: user.avatar
            }
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            refreshToken: null
        });

        return sendSuccess(res, 200, "Logged out successfully");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return sendError(res, 401, "Refresh token required");
        }

        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id).select("+refreshToken");

        if (!user || user.refreshToken !== token) {
            return sendError(res, 401, "Invalid refresh token");
        }

        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        return sendSuccess(res, 200, "Token refreshed", {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        return sendError(res, 401, "Invalid or expired refresh token");
    }
};

// GET /api/auth/verify-email?token=xxx
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return sendError(res, 400, "Verification token required");
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select("+emailVerificationToken");

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        if (user.isEmailVerified) {
            return sendSuccess(res, 200, "Email already verified");
        }

        if (user.emailVerificationToken !== token) {
            return sendError(res, 400, "Invalid verification token");
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailErr) {
            console.error("Welcome email failed:", emailErr.message);
        }

        return sendSuccess(res, 200, "Email verified successfully");

    } catch (error) {
        return sendError(res, 400, "Invalid or expired token");
    }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return sendError(res, 400, "Email is required");
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Security: don't reveal if email exists
            return sendSuccess(res, 200, "If this email exists, a reset link has been sent");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save({ validateBeforeSave: false });

        try {
            await sendPasswordResetEmail(email, user.name, resetToken);
        } catch (emailErr) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return sendError(res, 500, "Email could not be sent");
        }

        return sendSuccess(res, 200, "Password reset link sent to email");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return sendError(res, 400, "Token and new password required");
        }

        if (newPassword.length < 6) {
            return sendError(res, 400, "Password must be at least 6 characters");
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return sendError(res, 400, "Reset token is invalid or has expired");
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshToken = undefined; // invalidate all sessions
        await user.save();

        return sendSuccess(res, 200, "Password reset successfully. Please login.");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("defaultAddress")
            .populate("addresses");

        return sendSuccess(res, 200, "User fetched", { user });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    signup,
    login,
    logout,
    refreshToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getMe
};