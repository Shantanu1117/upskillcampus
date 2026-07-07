const DriverLocation = require("../models/DriverLocation");
const Order = require("../models/Order");
const { verifyAccessToken } = require("../utils/jwtUtils");

const initSocket = (io) => {

    // Auth middleware for socket
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = verifyAccessToken(token);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`✅ Socket connected: ${socket.userId}`);

        // Join user's room
        socket.join(`user_${socket.userId}`);

        // ==========================================
        // DRIVER EVENTS
        // ==========================================

        // Driver goes online
        socket.on("driver:go_online", async () => {
            if (socket.userRole !== "delivery_driver") return;

            await DriverLocation.findOneAndUpdate(
                { driver: socket.userId },
                { isOnline: true, lastUpdated: new Date() },
                { upsert: true, new: true }
            );

            socket.join("drivers_pool");
            console.log(`🟢 Driver ${socket.userId} is online`);
        });

        // Driver goes offline
        socket.on("driver:go_offline", async () => {
            if (socket.userRole !== "delivery_driver") return;

            await DriverLocation.findOneAndUpdate(
                { driver: socket.userId },
                { isOnline: false }
            );

            socket.leave("drivers_pool");
            console.log(`🔴 Driver ${socket.userId} is offline`);
        });

        // Driver updates location
        socket.on("driver:update_location", async (data) => {
            const { lat, lng, heading, speed } = data;

            const locationUpdate = await DriverLocation.findOneAndUpdate(
                { driver: socket.userId },
                {
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    heading: heading || 0,
                    speed: speed || 0,
                    lastUpdated: new Date()
                },
                { upsert: true, new: true }
            );

            // Get current order for this driver
            const activeOrder = await Order.findOne({
                driver: socket.userId,
                status: { $in: ["ASSIGNED", "PICKED_UP", "ON_THE_WAY"] }
            });

            if (activeOrder) {
                // Broadcast location to customer tracking this order
                io.to(`order_${activeOrder._id}`).emit("driver:location_updated", {
                    lat,
                    lng,
                    heading,
                    speed,
                    orderId: activeOrder._id
                });
            }
        });

        // ==========================================
        // CUSTOMER EVENTS
        // ==========================================

        // Customer joins order room to track
        socket.on("customer:track_order", (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`👤 Customer tracking order: ${orderId}`);
        });

        // Customer leaves tracking
        socket.on("customer:stop_tracking", (orderId) => {
            socket.leave(`order_${orderId}`);
        });

        // ==========================================
        // RESTAURANT EVENTS
        // ==========================================

        // Restaurant owner joins their room
        socket.on("restaurant:join", (restaurantId) => {
            if (socket.userRole === "restaurant_owner" || socket.userRole === "admin") {
                socket.join(`restaurant_${restaurantId}`);
                console.log(`🏪 Restaurant owner joined: ${restaurantId}`);
            }
        });

        // Restaurant accepts order
        socket.on("restaurant:accept_order", async (orderId) => {
            const order = await Order.findByIdAndUpdate(orderId, {
                status: "CONFIRMED",
                $push: {
                    statusHistory: {
                        status: "CONFIRMED",
                        note: "Accepted by restaurant"
                    }
                }
            }, { new: true });

            if (order) {
                io.to(`order_${order._id}`).emit("order_status_updated", {
                    orderId: order._id,
                    status: "CONFIRMED",
                    timestamp: new Date()
                });
            }
        });

        // Restaurant rejects order
        socket.on("restaurant:reject_order", async ({ orderId, reason }) => {
            const order = await Order.findByIdAndUpdate(orderId, {
                status: "REJECTED",
                $push: {
                    statusHistory: {
                        status: "REJECTED",
                        note: reason || "Rejected by restaurant"
                    }
                }
            }, { new: true });

            if (order) {
                io.to(`order_${order._id}`).emit("order_status_updated", {
                    orderId: order._id,
                    status: "REJECTED",
                    reason,
                    timestamp: new Date()
                });
            }
        });

        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on("disconnect", async () => {
            console.log(`❌ Socket disconnected: ${socket.userId}`);

            if (socket.userRole === "delivery_driver") {
                await DriverLocation.findOneAndUpdate(
                    { driver: socket.userId },
                    { isOnline: false }
                );
            }
        });
    });

    console.log("✅ Socket.IO initialized");
};

module.exports = { initSocket };