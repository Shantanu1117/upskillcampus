const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseUtils");

// GET /api/restaurants
const getAllRestaurants = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            cuisine,
            city,
            rating,
            sort = "rating",
            lat,
            lng,
            radius = 10 // km
        } = req.query;

        const query = { isActive: true, isVerified: true };

        if (search) {
            query.$text = { $search: search };
        }

        if (cuisine) {
            query.cuisines = { $in: [cuisine] };
        }

        if (city) {
            query["address.city"] = new RegExp(city, "i");
        }

        if (rating) {
            query.rating = { $gte: parseFloat(rating) };
        }

        // Location-based search
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius * 1000 // convert to meters
                }
            };
        }

        const sortOptions = {
            rating: { rating: -1 },
            newest: { createdAt: -1 },
            deliveryTime: { "deliveryTime.min": 1 },
            popular: { totalOrders: -1 }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Restaurant.countDocuments(query);
        
        const restaurants = await Restaurant.find(query)
            .sort(sortOptions[sort] || { rating: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("owner", "name email phone");

        return sendPaginated(res, 200, "Restaurants fetched", restaurants, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/restaurants/:id
const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .populate("owner", "name email phone");

        if (!restaurant || !restaurant.isActive) {
            return sendError(res, 404, "Restaurant not found");
        }

        // Get menu grouped by category
        const menuItems = await MenuItem.find({
            restaurant: req.params.id,
            isAvailable: true
        });

        const menuByCategory = {};
        menuItems.forEach(item => {
            if (!menuByCategory[item.category]) {
                menuByCategory[item.category] = [];
            }
            menuByCategory[item.category].push(item);
        });

        return sendSuccess(res, 200, "Restaurant fetched", {
            restaurant,
            menu: menuByCategory
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/restaurants (restaurant_owner, admin)
const createRestaurant = async (req, res) => {
    try {
        const { name, description, cuisines, address, phone, email, openingHours, deliveryFee, minimumOrder } = req.body;

        if (!name || !address || !phone) {
            return sendError(res, 400, "Name, address, and phone are required");
        }

        const restaurant = new Restaurant({
            name,
            description,
            cuisines,
            address,
            phone,
            email,
            openingHours,
            deliveryFee,
            minimumOrder,
            owner: req.user._id
        });

        await restaurant.save();
        return sendSuccess(res, 201, "Restaurant created", { restaurant });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return sendError(res, 404, "Restaurant not found");
        }

        // Only owner or admin can update
        if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return sendError(res, 403, "Not authorized");
        }

        const updated = await Restaurant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        return sendSuccess(res, 200, "Restaurant updated", { restaurant: updated });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/restaurants/:id (admin only)
const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!restaurant) {
            return sendError(res, 404, "Restaurant not found");
        }

        return sendSuccess(res, 200, "Restaurant deactivated");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/restaurants/nearby
const getNearbyRestaurants = async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return sendError(res, 400, "Latitude and longitude required");
        }

        const restaurants = await Restaurant.find({
            isActive: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000
                }
            }
        }).limit(20);

        return sendSuccess(res, 200, "Nearby restaurants", { restaurants });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// PATCH /api/restaurants/:id/toggle-open
const toggleRestaurantOpen = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return sendError(res, 404, "Restaurant not found");
        }

        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return sendError(res, 403, "Not authorized");
        }

        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();

        return sendSuccess(res, 200, `Restaurant is now ${restaurant.isOpen ? "open" : "closed"}`, {
            isOpen: restaurant.isOpen
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/restaurants/my (for restaurant owner)
const getMyRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return sendError(res, 404, "No restaurant found for this owner");
        }

        return sendSuccess(res, 200, "Restaurant fetched", { restaurant });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getAllRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getNearbyRestaurants,
    toggleRestaurantOpen,
    getMyRestaurant
};