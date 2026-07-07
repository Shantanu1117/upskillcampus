const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ["PERCENTAGE", "FIXED", "FREE_DELIVERY"],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number // cap for percentage discounts
    },
    minimumOrderAmount: {
        type: Number,
        default: 0
    },
    applicableRestaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    }],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    maxUsage: {
        type: Number,
        default: 1000
    },
    usedCount: {
        type: Number,
        default: 0
    },
    maxUsagePerUser: {
        type: Number,
        default: 1
    },
    usedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

couponSchema.index({ endDate: 1 });

module.exports = mongoose.model("Coupon", couponSchema);