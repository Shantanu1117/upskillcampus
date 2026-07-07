const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { sendSuccess, sendError } = require("../utils/responseUtils");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payment/create-order
const createPaymentOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return sendError(res, 404, "Order not found");
        }

        if (order.paymentMethod === "COD") {
            return sendError(
                res,
                400,
                "COD orders do not require online payment"
            );
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return sendError(res, 403, "Not authorized");
        }

        let razorpayOrder;
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(order.pricing.total * 100), // in paise
                currency: "INR",
                receipt: `receipt_${order.orderId}`,
                notes: {
                    orderId: order._id.toString(),
                    userId: req.user._id.toString()
                }
            });
        } catch (razorpayErr) {
            // Log the FULL raw error server-side — Razorpay/axios internals can
            // throw unhelpful, cryptic messages (seen in practice: bad/incomplete
            // RAZORPAY_KEY_ID/SECRET, or Razorpay's API unreachable). Whatever it
            // is, don't leak that raw string to the customer.
            console.error("Razorpay order creation failed:", razorpayErr);
            return sendError(
                res,
                502,
                "Payment gateway is unavailable right now. Please check your Razorpay API keys, or try Cash on Delivery."
            );
        }

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        await Payment.create({
            order: order._id,
            user: req.user._id,
            amount: order.pricing.total,
            method: order.paymentMethod,
            status: "CREATED",
            razorpayOrderId: razorpayOrder.id
        });

        return sendSuccess(res, 200, "Payment order created", {
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return sendError(res, 400, "All payment details required");
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return sendError(res, 400, "Payment verification failed - invalid signature");
        }

        // Update order
        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                paymentStatus: "PAID",
                razorpayPaymentId: razorpay_payment_id,
                status: "CONFIRMED",
                $push: {
                    statusHistory: {
                        status: "CONFIRMED",
                        note: "Payment received"
                    }
                }
            },
            { new: true }
        );
if (!order) {
    return sendError(
        res,
        404,
        "Order not found"
    );
}
        // Update payment record
        await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                status: "CAPTURED",
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            }
        );

        return sendSuccess(res, 200, "Payment verified successfully", {
            orderId: order._id,
            paymentId: razorpay_payment_id
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// POST /api/payment/webhook (Razorpay webhook)
const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({ error: "Invalid webhook signature" });
        }

        const { event, payload } = req.body;

        if (event === "payment.failed") {
            const paymentEntity = payload.payment.entity;
            await Order.findOneAndUpdate(
                { razorpayOrderId: paymentEntity.order_id },
                { paymentStatus: "FAILED" }
            );
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/payment/refund
const processRefund = async (req, res) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Order.findById(orderId);
        if (order.paymentMethod === "COD") {
    return sendError(
        res,
        400,
        "COD orders do not require online payment"
    );
}
        const payment = await Payment.findOne({ order: orderId, status: "CAPTURED" });

        if (!order || !payment) {
            return sendError(res, 404, "Order or payment not found");
        }

        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(order.pricing.total * 100),
            notes: { reason: reason || "Order cancelled" }
        });

        payment.status = "REFUNDED";
        payment.refundId = refund.id;
        payment.refundAmount = order.pricing.total;
        payment.refundReason = reason;
        payment.refundedAt = new Date();
        await payment.save();

        order.paymentStatus = "REFUNDED";
        await order.save();

        return sendSuccess(res, 200, "Refund initiated", {
            refundId: refund.id,
            amount: order.pricing.total
        });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handleWebhook,
    processRefund
};