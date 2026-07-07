const mongoose = require("mongoose");

const MAX_RETRY_DELAY_MS = 30000;
let retryDelayMs = 2000;

const connectDB = async () => {
    try {
        // Mongoose connection options
        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2
        };

        const conn = await mongoose.connect(
            process.env.MONGO_URI,
            options
        );

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
        retryDelayMs = 2000; // reset backoff once we're actually connected

        // Handle connection events
        mongoose.connection.on("error", (err) => {
            console.error(`❌ MongoDB connection error: ${err.message}`);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️  MongoDB disconnected. Attempting to reconnect...");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("✅ MongoDB reconnected");
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed due to app termination");
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        console.error(`Make sure MongoDB is running: mongod — retrying in ${retryDelayMs / 1000}s`);
        console.error("The server will keep running in the meantime; routes that need the database will fail until it connects.");

        setTimeout(connectDB, retryDelayMs);
        retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    }
};

module.exports = connectDB;