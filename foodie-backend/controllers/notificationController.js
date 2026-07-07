const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// POST /api/notifications/send (admin only)
const sendNotification = async (req, res) => {
    try {
        const { userId, title, message, type, data } = req.body;

        if (!userId || !title || !message || !type) {
            return sendError(res, 400, "userId, title, message and type are required");
        }

        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, 404, "User not found");
        }

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            data: data || {}
        });

        // Emit real-time notification via socket
        const io = req.app.get("io");
        if (io) {
            io.to(`user_${userId}`).emit("notification:new", {
                notification
            });
        }

        return sendSuccess(res, 201, "Notification sent", { notification });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/notifications/broadcast (admin only)
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, type, roles } = req.body;

        if (!title || !message || !type) {
            return sendError(res, 400, "title, message and type are required");
        }

        const query = { isActive: true };
        if (roles && roles.length > 0) {
            query.role = { $in: roles };
        }

        const users = await User.find(query).select("_id");

        const notifications = users.map(user => ({
            user: user._id,
            title,
            message,
            type,
            data: {}
        }));

        await Notification.insertMany(notifications);

        // Emit to all connected users
        const io = req.app.get("io");
        if (io) {
            io.emit("notification:broadcast", { title, message, type });
        }

        return sendSuccess(res, 201, `Notification sent to ${users.length} users`);

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/notifications/:id (admin only)
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(res, 200, "Notification deleted");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// GET /api/notifications/all (admin only)
const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 50, type, userId } = req.query;

        const query = {};
        if (type) query.type = type;
        if (userId) query.user = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Notification.countDocuments(query);

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("user", "name email");

        return res.status(200).json({
            success: true,
            data: notifications,
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

module.exports = {
    sendNotification,
    broadcastNotification,
    deleteNotification,
    getAllNotifications
};