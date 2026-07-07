const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: {
        type: String,
        required: [true, "Item name required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },
    discountedPrice: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    isVeg: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    tags: [String],
    allergens: [String],
    calories: {
        type: Number
    },
    customizations: [{
        name: String,
        options: [{
            label: String,
            price: { type: Number, default: 0 }
        }]
    }],
    rating: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

menuItemSchema.index({ restaurant: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ name: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);