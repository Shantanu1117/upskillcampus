const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, "Invalid phone number"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false
    },
    role: {
        type: String,
        enum: ["customer", "restaurant_owner", "delivery_driver", "admin"],
        default: "customer"
    },
    avatar: {
        type: String,
        default: ""
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    }],
    defaultAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },
    favouriteRestaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    }],
    deviceTokens: [{ // FCM tokens for push notifications
        type: String
    }],
    lastLogin: {
        type: Date
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Index for performance
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);