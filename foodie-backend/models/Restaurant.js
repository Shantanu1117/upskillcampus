const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Restaurant name is required"],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    cuisines: [{
        type: String,
        enum: ["Pizza", "Burger", "Biryani", "Chinese", "North Indian",
               "South Indian", "Desserts", "Drinks", "Soft Drinks",
               "Street Food", "Italian", "Continental", "Healthy"]
    }],
    images: [{
        type: String
    }],
    coverImage: {
        type: String,
        default: ""
    },
    address: {
        street: { type: String, required: true },
        area: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    openingHours: {
        monday:    { open: String, close: String, isOpen: { type: Boolean, default: true } },
        tuesday:   { open: String, close: String, isOpen: { type: Boolean, default: true } },
        wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        thursday:  { open: String, close: String, isOpen: { type: Boolean, default: true } },
        friday:    { open: String, close: String, isOpen: { type: Boolean, default: true } },
        saturday:  { open: String, close: String, isOpen: { type: Boolean, default: true } },
        sunday:    { open: String, close: String, isOpen: { type: Boolean, default: false } }
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    deliveryTime: {
        min: { type: Number, default: 20 },
        max: { type: Number, default: 40 }
    },
    deliveryFee: {
        type: Number,
        default: 40
    },
    minimumOrder: {
        type: Number,
        default: 99
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [String],
    totalOrders: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

restaurantSchema.index({ location: "2dsphere" });
restaurantSchema.index({ name: "text", cuisines: "text" });
restaurantSchema.index({ "address.city": 1 });
restaurantSchema.index({ rating: -1 });

module.exports = mongoose.model("Restaurant", restaurantSchema);