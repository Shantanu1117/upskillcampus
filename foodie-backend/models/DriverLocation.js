const mongoose = require("mongoose");

const driverLocationSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    heading: {
        type: Number, // direction in degrees
        default: 0
    },
    speed: {
        type: Number, // km/h
        default: 0
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

driverLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DriverLocation", driverLocationSchema);