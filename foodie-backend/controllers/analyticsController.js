const Order = require("../models/Order");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Payment = require("../models/Payment");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// GET /api/analytics/admin/dashboard
const getAdminDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        // Total counts
        const [
            totalUsers,
            totalRestaurants,
            totalOrders,
            todayOrders,
            activeDrivers
        ] = await Promise.all([
            User.countDocuments({ role: "customer", isActive: true }),
            Restaurant.countDocuments({ isActive: true, isVerified: true }),
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments({ role: "delivery_driver", isActive: true })
        ]);

        // Revenue stats
        const revenueStats = await Payment.aggregate([
            { $match: { status: "CAPTURED" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    thisMonthRevenue: {
                        $sum: {
                            $cond: [
                                { $gte: ["$createdAt", thisMonth] },
                                "$amount",
                                0
                            ]
                        }
                    },
                    lastMonthRevenue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ["$createdAt", lastMonth] },
                                        { $lte: ["$createdAt", lastMonthEnd] }
                                    ]
                                },
                                "$amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Order status distribution
        const orderStatusDist = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Cancellation rate
        const cancelledOrders = await Order.countDocuments({
            status: "CANCELLED"
        });
        const cancellationRate =
            totalOrders > 0
                ? ((cancelledOrders / totalOrders) * 100).toFixed(2)
                : 0;

        // Orders per day (last 7 days)
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const ordersPerDay = await Order.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: "$pricing.total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top restaurants by orders
        const topRestaurants = await Order.aggregate([
            { $match: { status: "DELIVERED" } },
            {
                $group: {
                    _id: "$restaurant",
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$pricing.total" }
                }
            },
            { $sort: { totalOrders: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "restaurants",
                    localField: "_id",
                    foreignField: "_id",
                    as: "restaurant"
                }
            },
            { $unwind: "$restaurant" },
            {
                $project: {
                    name: "$restaurant.name",
                    totalOrders: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // New users per day (last 7 days)
        const newUsersPerDay = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days },
                    role: "customer"
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const revenue = revenueStats[0] || {
            totalRevenue: 0,
            thisMonthRevenue: 0,
            lastMonthRevenue: 0
        };

        return sendSuccess(res, 200, "Admin dashboard data", {
            overview: {
                totalUsers,
                totalRestaurants,
                totalOrders,
                todayOrders,
                activeDrivers,
                cancellationRate: `${cancellationRate}%`,
                totalRevenue: revenue.totalRevenue,
                thisMonthRevenue: revenue.thisMonthRevenue,
                lastMonthRevenue: revenue.lastMonthRevenue
            },
            orderStatusDistribution: orderStatusDist,
            ordersPerDay,
            newUsersPerDay,
            topRestaurants
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/analytics/restaurant/:restaurantId/dashboard
const getRestaurantDashboard = async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        // Basic stats
        const [totalOrders, todayOrders, pendingOrders] = await Promise.all([
            Order.countDocuments({ restaurant: restaurantId }),
            Order.countDocuments({
                restaurant: restaurantId,
                createdAt: { $gte: today }
            }),
            Order.countDocuments({
                restaurant: restaurantId,
                status: { $in: ["PLACED", "CONFIRMED", "PREPARING"] }
            })
        ]);

        // Revenue
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    restaurant:
                        require("mongoose").Types.ObjectId.createFromHexString(
                            restaurantId
                        ),
                    status: "DELIVERED"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$pricing.total" },
                    thisMonthRevenue: {
                        $sum: {
                            $cond: [
                                { $gte: ["$createdAt", thisMonth] },
                                "$pricing.total",
                                0
                            ]
                        }
                    },
                    todayRevenue: {
                        $sum: {
                            $cond: [
                                { $gte: ["$createdAt", today] },
                                "$pricing.total",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Orders per day (last 30 days)
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const ordersPerDay = await Order.aggregate([
            {
                $match: {
                    restaurant:
                        require("mongoose").Types.ObjectId.createFromHexString(
                            restaurantId
                        ),
                    createdAt: { $gte: last30Days }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    orders: { $sum: 1 },
                    revenue: { $sum: "$pricing.total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top selling items
        const topItems = await Order.aggregate([
            {
                $match: {
                    restaurant:
                        require("mongoose").Types.ObjectId.createFromHexString(
                            restaurantId
                        ),
                    status: "DELIVERED"
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuItem",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Peak hours
        const peakHours = await Order.aggregate([
            {
                $match: {
                    restaurant:
                        require("mongoose").Types.ObjectId.createFromHexString(
                            restaurantId
                        )
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Rating distribution (real review data lives in the Review
        // collection, not on the Order document — Order.rating is
        // never populated by any controller)
        const Review = require("../models/Review");
        const ratingDist = await Review.aggregate([
            {
                $match: {
                    restaurant:
                        require("mongoose").Types.ObjectId.createFromHexString(
                            restaurantId
                        )
                }
            },
            {
                $group: {
                    _id: "$foodRating",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const revenue = revenueStats[0] || {
            totalRevenue: 0,
            thisMonthRevenue: 0,
            todayRevenue: 0
        };

        return sendSuccess(res, 200, "Restaurant dashboard data", {
            overview: {
                totalOrders,
                todayOrders,
                pendingOrders,
                totalRevenue: revenue.totalRevenue,
                thisMonthRevenue: revenue.thisMonthRevenue,
                todayRevenue: revenue.todayRevenue
            },
            ordersPerDay,
            topItems,
            peakHours,
            ratingDistribution: ratingDist
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getAdminDashboard,
    getRestaurantDashboard
};