const Review = require("../models/Review");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// POST /api/reviews
const createReview = async (req, res) => {
    try {
        const { orderId, foodRating, deliveryRating, comment } = req.body;

        if (!orderId || !foodRating) {
            return sendError(res, 400, "Order ID and food rating required");
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return sendError(res, 404, "Order not found");
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return sendError(res, 403, "Not authorized");
        }

        if (order.status !== "DELIVERED") {
            return sendError(res, 400, "Can only review delivered orders");
        }

        // Check if already reviewed
        const existing = await Review.findOne({ order: orderId, customer: req.user._id });
        if (existing) {
            return sendError(res, 400, "You already reviewed this order");
        }

        const overallRating = deliveryRating
            ? (foodRating + deliveryRating) / 2
            : foodRating;

        const review = await Review.create({
            order: orderId,
            customer: req.user._id,
            restaurant: order.restaurant,
            driver: order.driver,
            foodRating,
            deliveryRating,
            overallRating,
            comment
        });

        // Update restaurant average rating
        const allReviews = await Review.find({ restaurant: order.restaurant });
        const avgRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;

        await Restaurant.findByIdAndUpdate(order.restaurant, {
            rating: Math.round(avgRating * 10) / 10,
            totalRatings: allReviews.length
        });

        return sendSuccess(res, 201, "Review submitted", { review });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/reviews/restaurant/:restaurantId
const getRestaurantReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, rating } = req.query;

        const query = {
            restaurant: req.params.restaurantId,
            isPublic: true
        };

        if (rating) {
            query.overallRating = { $gte: parseFloat(rating) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Review.countDocuments(query);

        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("customer", "name avatar");

        return res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createReview, getRestaurantReviews };