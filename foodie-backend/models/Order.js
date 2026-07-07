const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true
        },
        name: String,
        price: Number,
        image: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        customizations: [{
            name: String,
            selectedOption: String,
            extraPrice: Number
        }],
        subtotal: Number
    }],
    deliveryAddress: {
        name: String,
        phone: String,
        street: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    pricing: {
        itemTotal: { type: Number, required: true },
        deliveryFee: { type: Number, default: 40 },
        packagingFee: { type: Number, default: 20 },
        discount: { type: Number, default: 0 },
        couponDiscount: { type: Number, default: 0 },
        taxes: { type: Number, default: 0 },
        tip: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ["UPI", "CARD", "COD", "WALLET"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PENDING"
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
        type: String,
        enum: [
            "PLACED",
            "CONFIRMED",
            "PREPARING",
            "READY",
            "ASSIGNED",
            "PICKED_UP",
            "ON_THE_WAY",
            "DELIVERED",
            "CANCELLED",
            "REJECTED"
        ],
        default: "PLACED"
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    specialInstructions: String,
    rating: {
        food: { type: Number, min: 1, max: 5 },
        delivery: { type: Number, min: 1, max: 5 },
        review: String
    }
}, { timestamps: true });

// Auto-generate order ID
orderSchema.pre("save", function() {
    if (!this.orderId) {
        this.orderId = "ORD" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ driver: 1, status: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);