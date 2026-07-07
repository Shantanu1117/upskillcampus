const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
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
            min: 1,
            default: 1
        },
        customizations: [{
            name: String,
            selectedOption: String,
            extraPrice: { type: Number, default: 0 }
        }],
        subtotal: Number
    }],
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null
    },
    pricing: {
        itemTotal: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 40 },
        packagingFee: { type: Number, default: 20 },
        discount: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }
}, { timestamps: true });



module.exports = mongoose.model("Cart", cartSchema);