const User = require("../models/User");
const Address = require("../models/Address");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const Restaurant = require("../models/Restaurant");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseUtils");

// ===========================
// GET PROFILE
// GET /api/users/profile
// ===========================
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("addresses")
            .populate("defaultAddress")
            .populate("favouriteRestaurants", "name image rating cuisines address isOpen");

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        return sendSuccess(res, 200, "Profile fetched", { user });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// UPDATE PROFILE
// PUT /api/users/profile
// ===========================
const updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;

        // Fields that are allowed to be updated
        const allowedUpdates = {};
        if (name) allowedUpdates.name = name;
        if (phone) allowedUpdates.phone = phone;
        if (avatar) allowedUpdates.avatar = avatar;

        if (Object.keys(allowedUpdates).length === 0) {
            return sendError(res, 400, "No valid fields to update");
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            allowedUpdates,
            { new: true, runValidators: true }
        ).populate("addresses").populate("defaultAddress");

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        return sendSuccess(res, 200, "Profile updated successfully", { user });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// DELETE ACCOUNT
// DELETE /api/users/account
// ===========================
const deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            isActive: false,
            email: `deleted_${Date.now()}_${req.user.email}`
        });

        return sendSuccess(res, 200, "Account deactivated successfully");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// GET ALL ADDRESSES
// GET /api/users/addresses
// ===========================
const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id });

        return sendSuccess(res, 200, "Addresses fetched", { addresses });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// ADD ADDRESS
// POST /api/users/addresses
// ===========================
const addAddress = async (req, res) => {
    try {
        const { label, name, phone, street, area, city, state, pincode, landmark, coordinates, isDefault } = req.body;

        if (!name || !phone || !street || !area || !city || !state || !pincode) {
            return sendError(res, 400, "All address fields are required");
        }

        const address = await Address.create({
            user: req.user._id,
            label: label || "HOME",
            name,
            phone,
            street,
            area,
            city,
            state,
            pincode,
            landmark,
            coordinates,
            isDefault: isDefault || false
        });

        // Add address to user's addresses array
        await User.findByIdAndUpdate(req.user._id, {
            $push: { addresses: address._id }
        });

        // If marked as default, update user's defaultAddress
        if (isDefault) {
            // Remove default from all other addresses
            await Address.updateMany(
                { user: req.user._id, _id: { $ne: address._id } },
                { isDefault: false }
            );

            await User.findByIdAndUpdate(req.user._id, {
                defaultAddress: address._id
            });
        }

        return sendSuccess(res, 201, "Address added successfully", { address });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// UPDATE ADDRESS
// PUT /api/users/addresses/:addressId
// ===========================
const updateAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.addressId,
            user: req.user._id
        });

        if (!address) {
            return sendError(res, 404, "Address not found");
        }

        const updatedAddress = await Address.findByIdAndUpdate(
            req.params.addressId,
            req.body,
            { new: true, runValidators: true }
        );

        return sendSuccess(res, 200, "Address updated", { address: updatedAddress });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// DELETE ADDRESS
// DELETE /api/users/addresses/:addressId
// ===========================
const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.addressId,
            user: req.user._id
        });

        if (!address) {
            return sendError(res, 404, "Address not found");
        }

        await Address.findByIdAndDelete(req.params.addressId);

        // Remove from user's addresses array
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { addresses: req.params.addressId }
        });

        // If deleted address was default, clear defaultAddress
        const user = await User.findById(req.user._id);
        if (user.defaultAddress &&
            user.defaultAddress.toString() === req.params.addressId) {
            await User.findByIdAndUpdate(req.user._id, {
                defaultAddress: null
            });
        }

        return sendSuccess(res, 200, "Address deleted successfully");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// SET DEFAULT ADDRESS
// PATCH /api/users/addresses/:addressId/set-default
// ===========================
const setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.addressId,
            user: req.user._id
        });

        if (!address) {
            return sendError(res, 404, "Address not found");
        }

        // Remove default from all user addresses
        await Address.updateMany(
            { user: req.user._id },
            { isDefault: false }
        );

        // Set this address as default
        address.isDefault = true;
        await address.save();

        // Update user's defaultAddress
        await User.findByIdAndUpdate(req.user._id, {
            defaultAddress: address._id
        });

        return sendSuccess(res, 200, "Default address updated", { address });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// GET FAVOURITE RESTAURANTS
// GET /api/users/favourites
// ===========================
const getFavouriteRestaurants = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate(
                "favouriteRestaurants",
                "name image rating cuisines address isOpen deliveryTime deliveryFee"
            );

        return sendSuccess(res, 200, "Favourite restaurants fetched", {
            favourites: user.favouriteRestaurants
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// ADD FAVOURITE RESTAURANT
// POST /api/users/favourites/:restaurantId
// ===========================
const addFavouriteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);

        if (!restaurant) {
            return sendError(res, 404, "Restaurant not found");
        }

        const user = await User.findById(req.user._id);

        // Check if already in favourites
        if (user.favouriteRestaurants.includes(req.params.restaurantId)) {
            return sendError(res, 400, "Restaurant already in favourites");
        }

        await User.findByIdAndUpdate(req.user._id, {
            $push: { favouriteRestaurants: req.params.restaurantId }
        });

        return sendSuccess(res, 200, "Restaurant added to favourites");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// REMOVE FAVOURITE RESTAURANT
// DELETE /api/users/favourites/:restaurantId
// ===========================
const removeFavouriteRestaurant = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { favouriteRestaurants: req.params.restaurantId }
        });

        return sendSuccess(res, 200, "Restaurant removed from favourites");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// GET NOTIFICATIONS
// GET /api/users/notifications
// ===========================
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const query = { user: req.user._id };
        if (unreadOnly === "true") query.isRead = false;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return sendPaginated(
            res,
            200,
            "Notifications fetched",
            notifications,
            {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
                unreadCount
            }
        );

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// MARK NOTIFICATION AS READ
// PATCH /api/users/notifications/:notificationId/read
// ===========================
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.notificationId,
                user: req.user._id
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(res, 200, "Notification marked as read", { notification });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// MARK ALL NOTIFICATIONS READ
// PATCH /api/users/notifications/read-all
// ===========================
const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );

        return sendSuccess(res, 200, "All notifications marked as read");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// GET ORDER HISTORY
// GET /api/users/order-history
// ===========================
const getOrderHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments({ customer: req.user._id });

        const orders = await Order.find({ customer: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("restaurant", "name image address cuisines")
            .populate("items.menuItem", "name image price")
            .select("-statusHistory -razorpayOrderId -razorpayPaymentId");

        return sendPaginated(res, 200, "Order history fetched", orders, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// ADMIN: GET ALL USERS
// GET /api/users/
// ===========================
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search } = req.query;

        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: new RegExp(search, "i") },
                { email: new RegExp(search, "i") },
                { phone: new RegExp(search, "i") }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select("-password -refreshToken -passwordResetToken -emailVerificationToken");

        return sendPaginated(res, 200, "Users fetched", users, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// ADMIN: GET USER BY ID
// GET /api/users/:userId
// ===========================
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select("-password -refreshToken -passwordResetToken -emailVerificationToken")
            .populate("addresses")
            .populate("defaultAddress");

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        // Get user's order count and total spent
        const orderStats = await Order.aggregate([
            { $match: { customer: user._id } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$pricing.total" },
                    completedOrders: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        return sendSuccess(res, 200, "User fetched", {
            user,
            stats: orderStats[0] || {
                totalOrders: 0,
                totalSpent: 0,
                completedOrders: 0
            }
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ===========================
// ADMIN: UPDATE USER ROLE
// PATCH /api/users/:userId/role
// ===========================
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        const validRoles = ["customer", "restaurant_owner", "delivery_driver", "admin"];

        if (!role || !validRoles.includes(role)) {
            return sendError(res, 400, `Role must be one of: ${validRoles.join(", ")}`);
        }

        // Prevent admin from changing their own role
        if (req.params.userId === req.user._id.toString()) {
            return sendError(res, 400, "You cannot change your own role");
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { role },
            { new: true }
        ).select("-password -refreshToken");

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        return sendSuccess(res, 200, `User role updated to ${role}`, { user });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    deleteAccount,
    addAddress,
    updateAddress,
    deleteAddress,
    getAddresses,
    setDefaultAddress,
    getFavouriteRestaurants,
    addFavouriteRestaurant,
    removeFavouriteRestaurant,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getOrderHistory,
    getAllUsers,
    getUserById,
    updateUserRole
};