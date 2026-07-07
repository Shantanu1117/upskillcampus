module.exports = {
    // Order statuses
    ORDER_STATUS: {
        PLACED: "PLACED",
        CONFIRMED: "CONFIRMED",
        PREPARING: "PREPARING",
        READY: "READY",
        ASSIGNED: "ASSIGNED",
        PICKED_UP: "PICKED_UP",
        ON_THE_WAY: "ON_THE_WAY",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
        REJECTED: "REJECTED"
    },

    // Payment statuses
    PAYMENT_STATUS: {
        PENDING: "PENDING",
        PAID: "PAID",
        FAILED: "FAILED",
        REFUNDED: "REFUNDED"
    },

    // Payment methods
    PAYMENT_METHOD: {
        UPI: "UPI",
        CARD: "CARD",
        COD: "COD",
        WALLET: "WALLET"
    },

    // User roles
    USER_ROLES: {
        CUSTOMER: "customer",
        RESTAURANT_OWNER: "restaurant_owner",
        DELIVERY_DRIVER: "delivery_driver",
        ADMIN: "admin"
    },

    // Notification types
    NOTIFICATION_TYPES: {
        ORDER_PLACED: "ORDER_PLACED",
        ORDER_CONFIRMED: "ORDER_CONFIRMED",
        ORDER_PREPARING: "ORDER_PREPARING",
        DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
        ORDER_PICKED: "ORDER_PICKED",
        ORDER_DELIVERED: "ORDER_DELIVERED",
        ORDER_CANCELLED: "ORDER_CANCELLED",
        PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
        PAYMENT_FAILED: "PAYMENT_FAILED",
        PROMO: "PROMO",
        GENERAL: "GENERAL"
    },

    // Coupon types
    COUPON_TYPE: {
        PERCENTAGE: "PERCENTAGE",
        FIXED: "FIXED",
        FREE_DELIVERY: "FREE_DELIVERY"
    },

    // Cuisines list
    CUISINES: [
        "Pizza",
        "Burger",
        "Biryani",
        "Chinese",
        "North Indian",
        "South Indian",
        "Desserts",
        "Drinks",
        "Soft Drinks",
        "Street Food",
        "Italian",
        "Continental",
        "Healthy",
        "Sandwich",
        "Pasta",
        "Coffee",
        "Ice Cream",
        "Seafood",
        "Rolls",
        "Wraps"
    ],

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    // File upload limits
    UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_FILES: 5,
        ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    },

    // Delivery
    DELIVERY: {
        DEFAULT_FEE: 40,
        DEFAULT_PACKAGING_FEE: 20,
        DEFAULT_MIN_ORDER: 99,
        DEFAULT_SEARCH_RADIUS_KM: 10
    },

    // JWT
    JWT: {
        ACCESS_EXPIRE: "7d",
        REFRESH_EXPIRE: "30d",
        EMAIL_EXPIRE: "24h",
        RESET_EXPIRE: "10m"
    }
};