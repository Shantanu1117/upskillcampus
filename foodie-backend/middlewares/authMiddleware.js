const { verifyAccessToken } = require("../utils/jwtUtils");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Token invalid."
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account has been deactivated."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid token."
        });
    }
};

module.exports = { protect };