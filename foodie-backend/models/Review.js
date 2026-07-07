const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
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
        ref: "User"
    },
    foodRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    deliveryRating: {
        type: Number,
        min: 1,
        max: 5
    },
    overallRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: [500, "Review too long"]
    },
    images: [String],
    isPublic: {
        type: Boolean,
        default: true
    },
    restaurantReply: {
        message: String,
        repliedAt: Date
    }
}, { timestamps: true });

reviewSchema.index({ restaurant: 1, overallRating: -1 });
reviewSchema.index({ customer: 1 });

module.exports = mongoose.model("Review", reviewSchema);