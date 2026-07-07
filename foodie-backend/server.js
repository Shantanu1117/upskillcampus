require("dotenv").config();
console.log("protect:", typeof require("./middlewares/authMiddleware").protect);
console.log("authorize:", typeof require("./middlewares/roleMiddleware").authorize);
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");
const { initSocket } = require("./sockets/socketHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const contactRoutes = require("./routes/contactRoutes");

// Connect Database
connectDB();

// Express App
const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    }
});

app.set("io", io);
initSocket(io);

// Middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🍔 Foodie API Running",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            restaurants: "/api/restaurants",
            menu: "/api/menu",
            cart: "/api/cart",
            orders: "/api/orders",
            payment: "/api/payment",
            reviews: "/api/reviews",
            coupons: "/api/coupons",
            notifications: "/api/notifications",
            categories: "/api/categories",
            upload: "/api/upload",
            analytics: "/api/analytics"
        }
    });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/contact", contactRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO ready`);
    console.log(`\n📋 Routes:`);
    console.log(`   Auth       → /api/auth`);
    console.log(`   Users      → /api/users`);
    console.log(`   Restaurants→ /api/restaurants`);
    console.log(`   Menu       → /api/menu`);
    console.log(`   Cart       → /api/cart`);
    console.log(`   Orders     → /api/orders`);
    console.log(`   Payment    → /api/payment`);
    console.log(`   Reviews    → /api/reviews`);
    console.log(`   Coupons    → /api/coupons`);
    console.log(`   Notify     → /api/notifications`);
    console.log(`   Categories → /api/categories`);
    console.log(`   Upload     → /api/upload`);
    console.log(`   Analytics  → /api/analytics`);
    console.log(`   Contact    → /api/contact\n`);
});

module.exports = { app, server };