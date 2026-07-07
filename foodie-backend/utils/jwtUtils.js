const jwt = require("jsonwebtoken");

// ===========================
// GENERATE ACCESS TOKEN
// ===========================
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        {
            id: userId,
            role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || "7d"
        }
    );
};

// ===========================
// GENERATE REFRESH TOKEN
// ===========================
const generateRefreshToken = (userId) => {
    return jwt.sign(
        {
            id: userId
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d"
        }
    );
};

// ===========================
// VERIFY ACCESS TOKEN
// ===========================
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// ===========================
// VERIFY REFRESH TOKEN
// ===========================
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// ===========================
// GENERATE EMAIL VERIFICATION TOKEN
// ===========================
const generateEmailToken = (userId) => {
    return jwt.sign(
        {
            id: userId,
            purpose: "email_verification"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "24h"
        }
    );
};

// ===========================
// DECODE TOKEN WITHOUT VERIFY
// (for expired token reading)
// ===========================
const decodeToken = (token) => {
    return jwt.decode(token);
};

// ===========================
// GET TOKEN EXPIRY DATE
// ===========================
const getTokenExpiry = (token) => {
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
    }
    return null;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateEmailToken,
    decodeToken,
    getTokenExpiry
};