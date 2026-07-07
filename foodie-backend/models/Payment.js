const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    method: {
        type: String,
        enum: ["UPI", "CARD", "COD", "WALLET"],
        required: true
    },
    status: {
        type: String,
        enum: ["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
        default: "CREATED"
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);