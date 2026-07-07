const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    label: {
        type: String,
        enum: ["HOME", "WORK", "OTHER"],
        default: "HOME"
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

addressSchema.index({ user: 1 });

module.exports = mongoose.model("Address", addressSchema);