const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Restaurant = require("../models/Restaurant");
const Notification = require("../models/Notification");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseUtils");
const { sendOrderStatusEmail, sendOrderReceiptEmail } = require("../utils/emailUtils");

// POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { deliveryAddress, paymentMethod, specialInstructions, tip } = req.body;

        if (!deliveryAddress || !paymentMethod) {
            return sendError(res, 400, "Delivery address and payment method required");
        }

        const tipAmount = Math.max(0, Number(tip) || 0);

        const cart = await Cart.findOne({ user: req.user._id })
            .populate("items.menuItem")
            .populate("restaurant");

        if (!cart || cart.items.length === 0) {
            return sendError(res, 400, "Cart is empty");
        }

        if (!cart.restaurant.isOpen) {
            return sendError(res, 400, "Restaurant is currently closed");
        }

        // Validate minimum order
        if (cart.pricing.itemTotal < cart.restaurant.minimumOrder) {
            return sendError(res, 400, `Minimum order amount is ₹${cart.restaurant.minimumOrder}`);
        }

        const orderItems = cart.items.map(item => ({
            menuItem: item.menuItem._id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            customizations: item.customizations,
            subtotal: item.subtotal
        }));

        const order = new Order({
            customer: req.user._id,
            restaurant: cart.restaurant._id,
            items: orderItems,
            deliveryAddress,
            pricing: {
                itemTotal: cart.pricing.itemTotal,
                deliveryFee: cart.pricing.deliveryFee,
                packagingFee: cart.pricing.packagingFee,
                discount: cart.pricing.discount,
                couponDiscount: cart.pricing.couponDiscount || 0,
                taxes: cart.pricing.taxes || 0,
                tip: tipAmount,
                total: cart.pricing.total + tipAmount
            },
            paymentMethod,
            specialInstructions,
            statusHistory: [{ status: "PLACED", note: "Order placed by customer" }]
        });

        await order.save();

        // Update restaurant order count
        await Restaurant.findByIdAndUpdate(cart.restaurant._id, {
            $inc: { totalOrders: 1 }
        });

        // Clear cart after order
     await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
        items: [],
        restaurant: null,
        coupon: null,
        pricing: {
            itemTotal: 0,
            deliveryFee: 40,
            packagingFee: 20,
            discount: 0,
            total: 0
        }
    }
);

        // Create notification
        await Notification.create({
            user: req.user._id,
            title: "Order Placed! 🎉",
            message: `Your order #${order.orderId} has been placed successfully`,
            type: "ORDER_PLACED",
            data: { orderId: order.orderId }
        });

        // Send email
        try {
            await sendOrderStatusEmail(
                req.user.email,
                req.user.name,
                order.orderId,
                "PLACED"
            );
        } catch (emailErr) {
            console.error("Order email failed:", emailErr.message);
        }

        await order.populate("restaurant", "name phone address");

        try {
            await sendOrderReceiptEmail(req.user.email, req.user.name, order);
        } catch (emailErr) {
            console.error("Order receipt email failed:", emailErr.message);
        }

        return sendSuccess(res, 201, "Order placed successfully", { order });

    } catch (error) {
        console.error("createOrder failed:", error);
        return sendError(res, 500, error.message);
    }
};

// GET /api/orders (customer's orders)
const getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { customer: req.user._id };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("restaurant", "name image address phone")
            .populate("items.menuItem", "name image");

        return sendPaginated(res, 200, "Orders fetched", orders, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        console.error("Order operation failed:", error);
        return sendError(res, 500, error.message);
    }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("restaurant", "name image address phone")
            .populate("customer", "name email phone")
            .populate("driver", "name phone")
            .populate("items.menuItem", "name image");

        if (!order) {
            return sendError(res, 404, "Order not found");
        }

        // Authorization check
        const isCustomer = order.customer._id.toString() === req.user._id.toString();
       let isRestaurantOwner = false;

if(req.user.role === "restaurant_owner"){

    const restaurant =
    await Restaurant.findOne({
        owner: req.user._id
    });

    if(
        restaurant &&
        restaurant._id.toString() ===
        order.restaurant._id.toString()
    ){
        isRestaurantOwner = true;
    }
}

        const isDriver = order.driver && order.driver._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
if (
    !isCustomer &&
    !isRestaurantOwner &&
    !isDriver &&
    !isAdmin
) {
    return sendError(
        res,
        403,
        "Not authorized"
    );
}
        if (!isCustomer && !isRestaurantOwner && !isDriver && !isAdmin) {
            return sendError(res, 403, "Not authorized");
        }

        return sendSuccess(res, 200, "Order fetched", { order });

    } catch (error) {
        console.error("Order operation failed:", error);
        return sendError(res, 500, error.message);
    }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;

        const validStatuses = [
            "CONFIRMED", "PREPARING", "READY", "ASSIGNED",
            "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED", "REJECTED"
        ];

        if (!validStatuses.includes(status)) {
            return sendError(res, 400, "Invalid status");
        }

        const order = await Order.findById(req.params.id)
            .populate("customer", "name email")
            .populate("restaurant");

        if (!order) {
            return sendError(res, 404, "Order not found");
        }
if(req.user.role === "restaurant_owner"){

    const restaurant =
    await Restaurant.findOne({
        owner: req.user._id
    });

    if(
        !restaurant ||
        restaurant._id.toString() !==
        order.restaurant._id.toString()
    ){
        return sendError(
            res,
            403,
            "Not authorized"
        );
    }
}
        order.status = status;
        order.statusHistory.push({
            status,
            note: note || `Status updated to ${status}`
        });

        if (status === "DELIVERED") {
            order.actualDeliveryTime = new Date();
            order.paymentStatus = order.paymentMethod === "COD" ? "PAID" : order.paymentStatus;
        }

        await order.save();

        // Every Order.status value must map to a valid Notification.type
        // enum value — a few don't have a 1:1 match, so they fall back to
        // the closest existing type instead of crashing on an invalid enum.
        const NOTIFICATION_TYPE_MAP = {
            CONFIRMED: "ORDER_CONFIRMED",
            PREPARING: "ORDER_PREPARING",
            READY: "ORDER_PREPARING",
            ASSIGNED: "DRIVER_ASSIGNED",
            PICKED_UP: "ORDER_PICKED",
            ON_THE_WAY: "ORDER_PICKED",
            DELIVERED: "ORDER_DELIVERED",
            CANCELLED: "ORDER_CANCELLED",
            REJECTED: "ORDER_CANCELLED"
        };

        // Notify customer
        try {
            await Notification.create({
                user: order.customer._id,
                title: `Order ${status}`,
                message: `Your order #${order.orderId} is now ${status}`,
                type: NOTIFICATION_TYPE_MAP[status] || "GENERAL",
                data: { orderId: order.orderId }
            });
        } catch (notifErr) {
            console.error("Notification creation failed:", notifErr.message);
        }

        // Email for key statuses
        const emailStatuses = ["CONFIRMED", "PREPARING", "ON_THE_WAY", "DELIVERED"];
        if (emailStatuses.includes(status)) {
            try {
                await sendOrderStatusEmail(
                    order.customer.email,
                    order.customer.name,
                    order.orderId,
                    status
                );
            } catch (emailErr) {
                console.error("Status email failed:", emailErr.message);
            }
        }

        // Emit socket event
        const io = req.app.get("io");
        if (io) {
            io.to(`order_${order._id}`).emit("order_status_updated", {
                orderId: order._id,
                status,
                timestamp: new Date()
            });
        }

        return sendSuccess(res, 200, "Order status updated", { order });

    } catch (error) {
        console.error("Order operation failed:", error);
        return sendError(res, 500, error.message);
    }
};

// GET /api/orders/restaurant/:restaurantId (for restaurant owners)
const getRestaurantOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = { restaurant: req.params.restaurantId };
        if(req.user.role === "restaurant_owner"){

    const restaurant = await Restaurant.findOne({
        owner: req.user._id
    });

    if(
        !restaurant ||
        restaurant._id.toString() !==
        req.params.restaurantId
    ){
        return sendError(
            res,
            403,
            "Not authorized"
        );
    }
}
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("customer", "name phone")
            .populate("items.menuItem", "name");

        return sendPaginated(res, 200, "Restaurant orders", orders, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        });

    } catch (error) {
        console.error("Order operation failed:", error);
        return sendError(res, 500, error.message);
    }
};

// POST /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        

        if (!order) {
            return sendError(res, 404, "Order not found");
        }
if(req.user.role === "restaurant_owner"){

    const restaurant =
    await Restaurant.findOne({
        owner: req.user._id
    });

    if(
        !restaurant ||
        restaurant._id.toString() !==
        order.restaurant.toString()
    ){
        return sendError(
            res,
            403,
            "Not authorized"
        );
    }
}
       const isCustomer =
    order.customer.toString() ===
    req.user._id.toString();

const isRestaurantOwner =
    req.user.role === "restaurant_owner";

if(!isCustomer && !isRestaurantOwner){
    return sendError(
        res,
        403,
        "Not authorized"
    );
}

        const cancellableStatuses = ["PLACED", "CONFIRMED"];
        if (!cancellableStatuses.includes(order.status)) {
            return sendError(res, 400, "Order cannot be cancelled at this stage");
        }

        order.status = "CANCELLED";
        order.statusHistory.push({
            status: "CANCELLED",
            note: req.body.reason || "Cancelled by customer"
        });

        await order.save();

        return sendSuccess(res, 200, "Order cancelled", { order });

    } catch (error) {
        console.error("Order operation failed:", error);
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getRestaurantOrders,
    cancelOrder
};