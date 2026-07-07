const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// POST /api/coupons/validate
const validateCoupon = async (req, res) => {
    try {
        const { code, restaurantId } = req.body;

        if (!code) {
            return sendError(res, 400, "Coupon code required");
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!coupon) {
            return sendError(res, 404, "Invalid or expired coupon");
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.maxUsage) {
            return sendError(res, 400, "Coupon usage limit reached");
        }

        // Check per-user usage
        const userUsage = coupon.usedBy.filter(
            u => u.user.toString() === req.user._id.toString()
        ).length;

        if (userUsage >= coupon.maxUsagePerUser) {
            return sendError(res, 400, "You have already used this coupon");
        }

        // Check restaurant restriction
        if (coupon.applicableRestaurants.length > 0 && restaurantId) {
            if (!coupon.applicableRestaurants.includes(restaurantId)) {
                return sendError(res, 400, "Coupon not valid for this restaurant");
            }
        }

        // Get cart for minimum order check
        const cart = await Cart.findOne({ user: req.user._id });
        const cartItemTotal = cart ? cart.pricing.itemTotal : 0;
        const cartDeliveryFee = cart ? cart.pricing.deliveryFee : 0;

        if (cartItemTotal < coupon.minimumOrderAmount) {
            return sendError(res, 400, `Minimum order amount is ₹${coupon.minimumOrderAmount}`);
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === "PERCENTAGE") {
            discount = (cartItemTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else if (coupon.type === "FIXED") {
            discount = coupon.value;
        } else if (coupon.type === "FREE_DELIVERY") {
            discount = cartDeliveryFee;
        }

        return sendSuccess(res, 200, "Coupon applied", {
            coupon: {
                id: coupon._id,
                code: coupon.code,
                type: coupon.type,
                description: coupon.description
            },
            discount
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/coupons/active (public — anyone can browse current offers)
const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ["$usedCount", "$maxUsage"] }
        })
            .select("code description type value maxDiscount minimumOrderAmount endDate")
            .sort({ createdAt: -1 });

        return sendSuccess(res, 200, "Active offers fetched", { coupons });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/coupons (admin only)
const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        return sendSuccess(res, 200, "Coupons fetched", { coupons });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/coupons (admin only)
const createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create({
            ...req.body,
            createdBy: req.user._id
        });
        return sendSuccess(res, 201, "Coupon created", { coupon });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/coupons/:id (admin only)
const deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
        return sendSuccess(res, 200, "Coupon deactivated");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { validateCoupon, getActiveCoupons, getAllCoupons, createCoupon, deleteCoupon };