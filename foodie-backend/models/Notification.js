const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            "ORDER_PLACED",
            "ORDER_CONFIRMED",
            "ORDER_PREPARING",
            "DRIVER_ASSIGNED",
            "ORDER_PICKED",
            "ORDER_DELIVERED",
            "ORDER_CANCELLED",
            "PAYMENT_SUCCESS",
            "PAYMENT_FAILED",
            "PROMO",
            "GENERAL"
        ],
        required: true
    },
    data: {
        orderId: String,
        restaurantId: String,
        couponCode: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);