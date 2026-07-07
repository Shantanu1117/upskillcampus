const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// GET /api/menu/restaurant/:restaurantId
const getMenuByRestaurant = async (req, res) => {
    try {
        const { category, veg, search } = req.query;

        const query = {
            restaurant: req.params.restaurantId,
            isAvailable: true
        };

        if (category) query.category = category;
        if (veg === "true") query.isVeg = true;
        if (search) query.$text = { $search: search };

        const items = await MenuItem.find(query).sort({ isBestSeller: -1, name: 1 });

        // Group by category
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
        });

        return sendSuccess(res, 200, "Menu fetched", { menu: grouped, total: items.length });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/menu (restaurant owner)
const addMenuItem = async (req, res) => {
    try {
        const { name, description, price, category, isVeg, customizations } = req.body;

        if (!name || !price || !category) {
            return sendError(res, 400, "Name, price, and category required");
        }

        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return sendError(res, 404, "Restaurant not found for this owner");
        }

        const menuItem = await MenuItem.create({
            restaurant: restaurant._id,
            name,
            description,
            price,
            category,
            isVeg,
            customizations,
            image: req.body.image || ""
        });

        return sendSuccess(res, 201, "Menu item added", { menuItem });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// PUT /api/menu/:id
const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return sendError(res, 404, "Menu item not found");
        }

        return sendSuccess(res, 200, "Menu item updated", { menuItem });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/menu/:id
const deleteMenuItem = async (req, res) => {
    try {
        await MenuItem.findByIdAndUpdate(req.params.id, { isAvailable: false });
        return sendSuccess(res, 200, "Menu item removed");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { getMenuByRestaurant, addMenuItem, updateMenuItem, deleteMenuItem };