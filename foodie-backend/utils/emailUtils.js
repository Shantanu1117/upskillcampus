const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Email transporter error:", error.message);
    } else {
        console.log("✅ Email transporter ready");
    }
});

// ===========================
// BASE SEND EMAIL
// ===========================
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || "Foodie <no-reply@foodie.com>",
            to,
            subject,
            html,
            text: text || ""
        });
        console.log(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("❌ Email error:", error.message);
        throw error;
    }
};

// ===========================
// EMAIL VERIFICATION
// ===========================
const sendVerificationEmail = async (email, name, token) => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    await sendEmail({
        to: email,
        subject: "Verify Your Foodie Account 🍔",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Poppins', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: #ff8c00; padding: 40px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 32px; }
                .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
                .body { padding: 40px; }
                .body h2 { color: #222; font-size: 24px; margin-top: 0; }
                .body p { color: #555; line-height: 1.8; font-size: 16px; }
                .btn { display: inline-block; background: #ff8c00; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
                .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; }
                .warning { background: #fff8e6; border-left: 4px solid #ff8c00; padding: 16px; border-radius: 8px; margin: 24px 0; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍔 Foodie</h1>
                    <p>Delicious Food, Delivered Fast</p>
                </div>
                <div class="body">
                    <h2>Welcome, ${name}! 🎉</h2>
                    <p>Thank you for joining Foodie! You're just one step away from ordering delicious food from hundreds of restaurants near you.</p>
                    <p>Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center;">
                        <a href="${verifyUrl}" class="btn">✅ Verify My Email</a>
                    </div>
                    <div class="warning">
                        ⏰ This verification link will expire in <strong>24 hours</strong>.
                    </div>
                    <p>If the button doesn't work, copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; color: #ff8c00; font-size: 14px;">${verifyUrl}</p>
                    <p>If you did not create a Foodie account, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Foodie. All Rights Reserved.</p>
                    <p>foodie@gmail.com | +91 9876543210</p>
                </div>
            </div>
        </body>
        </html>
        `
    });
};

// ===========================
// PASSWORD RESET
// ===========================
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await sendEmail({
        to: email,
        subject: "Reset Your Foodie Password 🔐",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: #ff8c00; padding: 40px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 32px; }
                .body { padding: 40px; }
                .body h2 { color: #222; }
                .body p { color: #555; line-height: 1.8; }
                .btn { display: inline-block; background: #ff8c00; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
                .warning { background: #fff0f0; border-left: 4px solid #ff4444; padding: 16px; border-radius: 8px; margin: 24px 0; color: #666; }
                .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍔 Foodie</h1>
                </div>
                <div class="body">
                    <h2>Password Reset Request 🔐</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>We received a request to reset your Foodie account password. Click the button below to create a new password:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="btn">🔑 Reset My Password</a>
                    </div>
                    <div class="warning">
                        ⚠️ This link will expire in <strong>10 minutes</strong> for security reasons.
                    </div>
                    <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    <p>If the button doesn't work, copy and paste this link:</p>
                    <p style="word-break: break-all; color: #ff8c00; font-size: 14px;">${resetUrl}</p>
                </div>
                <div class="footer">
                    <p>© 2025 Foodie. All Rights Reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    });
};

// ===========================
// ORDER STATUS EMAIL
// ===========================
const sendOrderStatusEmail = async (email, name, orderId, status) => {
    const statusConfig = {
        PLACED: {
            emoji: "🎉",
            title: "Order Placed Successfully!",
            message: "Your order has been placed and is waiting for restaurant confirmation.",
            color: "#ff8c00"
        },
        CONFIRMED: {
            emoji: "✅",
            title: "Order Confirmed!",
            message: "The restaurant has confirmed your order and will start preparing it soon.",
            color: "#00a651"
        },
        PREPARING: {
            emoji: "👨‍🍳",
            title: "Your Food is Being Prepared!",
            message: "Our chefs are working hard to prepare your delicious meal.",
            color: "#ff8c00"
        },
        ON_THE_WAY: {
            emoji: "🛵",
            title: "Order Out for Delivery!",
            message: "Your order has been picked up and is on its way to you.",
            color: "#0066ff"
        },
        DELIVERED: {
            emoji: "🏠",
            title: "Order Delivered!",
            message: "Your order has been delivered. Enjoy your meal! Don't forget to rate your experience.",
            color: "#00a651"
        },
        CANCELLED: {
            emoji: "❌",
            title: "Order Cancelled",
            message: "Your order has been cancelled. If you paid online, refund will be processed within 5-7 business days.",
            color: "#ff4444"
        }
    };

    const config = statusConfig[status] || {
        emoji: "📦",
        title: `Order ${status}`,
        message: `Your order status has been updated to ${status}.`,
        color: "#ff8c00"
    };

    await sendEmail({
        to: email,
        subject: `${config.emoji} ${config.title} - Order #${orderId}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { background: ${config.color}; padding: 40px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 32px; }
                .header .emoji { font-size: 60px; display: block; margin-bottom: 10px; }
                .body { padding: 40px; }
                .body h2 { color: #222; margin-top: 0; }
                .body p { color: #555; line-height: 1.8; font-size: 16px; }
                .order-box { background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0; }
                .order-box p { margin: 8px 0; color: #444; }
                .btn { display: inline-block; background: ${config.color}; color: white; padding: 14px 35px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
                .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="emoji">${config.emoji}</span>
                    <h1>Foodie</h1>
                </div>
                <div class="body">
                    <h2>${config.title}</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>${config.message}</p>
                    <div class="order-box">
                        <p><strong>📋 Order ID:</strong> #${orderId}</p>
                        <p><strong>📊 Status:</strong> ${status}</p>
                        <p><strong>🕐 Updated:</strong> ${new Date().toLocaleString("en-IN")}</p>
                    </div>
                    <div style="text-align: center;">
                        <a href="${process.env.CLIENT_URL}/mega8.html" class="btn">
                            📍 Track Your Order
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2025 Foodie. All Rights Reserved.</p>
                    <p>Need help? Contact us at foodie@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
        `
    });
};

// ===========================
// WELCOME EMAIL
// ===========================
const sendWelcomeEmail = async (email, name) => {
    await sendEmail({
        to: email,
        subject: "Welcome to Foodie! 🍔 Your First Order Awaits",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #ff8c00, #ff4500); padding: 50px 40px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 36px; }
                .header p { color: rgba(255,255,255,0.9); font-size: 18px; margin: 10px 0 0; }
                .body { padding: 40px; }
                .feature { display: flex; align-items: center; margin: 20px 0; }
                .feature-icon { font-size: 32px; margin-right: 16px; }
                .feature-text h4 { margin: 0 0 4px; color: #222; }
                .feature-text p { margin: 0; color: #666; font-size: 14px; }
                .coupon-box { background: linear-gradient(135deg, #ff8c00, #ff4500); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0; }
                .coupon-box h3 { color: white; margin: 0 0 8px; font-size: 22px; }
                .coupon-code { background: white; color: #ff8c00; font-size: 28px; font-weight: 700; padding: 12px 30px; border-radius: 10px; display: inline-block; letter-spacing: 4px; margin: 10px 0; }
                .coupon-box p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
                .btn { display: inline-block; background: #ff8c00; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; }
                .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍔 Welcome to Foodie!</h1>
                    <p>Delicious food, delivered fast</p>
                </div>
                <div class="body">
                    <h2 style="color: #222;">Hi ${name}! 👋</h2>
                    <p style="color: #555; line-height: 1.8;">We're thrilled to have you on board! Foodie connects you with the best restaurants in your city for fast, reliable food delivery.</p>

                    <div class="feature">
                        <span class="feature-icon">🏪</span>
                        <div class="feature-text">
                            <h4>128+ Restaurants</h4>
                            <p>Choose from hundreds of top-rated restaurants near you</p>
                        </div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">⚡</span>
                        <div class="feature-text">
                            <h4>30-Minute Delivery</h4>
                            <p>Fast delivery so your food arrives hot and fresh</p>
                        </div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">💳</span>
                        <div class="feature-text">
                            <h4>Multiple Payment Options</h4>
                            <p>Pay via UPI, Card, or Cash on Delivery</p>
                        </div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">📍</span>
                        <div class="feature-text">
                            <h4>Live Order Tracking</h4>
                            <p>Track your order in real-time on the map</p>
                        </div>
                    </div>

                    <div class="coupon-box">
                        <h3>🎁 First Order Special!</h3>
                        <div class="coupon-code">FOOD20</div>
                        <p>Get 20% OFF on your first order (up to ₹150)</p>
                    </div>

                    <div style="text-align: center;">
                        <a href="${process.env.CLIENT_URL}/mega1.html" class="btn">
                            🍕 Order Now
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2025 Foodie. All Rights Reserved.</p>
                    <p>foodie@gmail.com | +91 9876543210</p>
                    <p>You received this email because you created a Foodie account.</p>
                </div>
            </div>
        </body>
        </html>
        `
    });
};

// ===========================
// ORDER RECEIPT EMAIL
// ===========================
const sendOrderReceiptEmail = async (email, name, order) => {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.subtotal}</td>
        </tr>
    `).join("");

    await sendEmail({
        to: email,
        subject: `🧾 Order Receipt - #${order.orderId}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; }
                .header { background: #ff8c00; padding: 30px 40px; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .header p { color: rgba(255,255,255,0.9); margin: 6px 0 0; }
                .body { padding: 40px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f5f5f5; padding: 12px; text-align: left; color: #444; font-size: 13px; text-transform: uppercase; }
                .total-row td { padding: 16px 12px; font-weight: 700; font-size: 18px; color: #ff8c00; border-top: 2px solid #ff8c00; }
                .info-box { background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0; }
                .info-box p { margin: 8px 0; color: #555; }
                .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧾 Order Receipt</h1>
                    <p>Order #${order.orderId} | ${new Date().toLocaleDateString("en-IN")}</p>
                </div>
                <div class="body">
                    <p>Hi <strong>${name}</strong>, thank you for your order!</p>

                    <div class="info-box">
                        <p><strong>🏪 Restaurant:</strong> ${order.restaurant?.name || "Restaurant"}</p>
                        <p><strong>💳 Payment:</strong> ${order.paymentMethod}</p>
                        <p><strong>📍 Delivery to:</strong> ${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 10px 12px; color: #666;">Item Total</td>
                                <td style="padding: 10px 12px; text-align: right; color: #666;">₹${order.pricing?.itemTotal}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding: 10px 12px; color: #666;">Delivery Fee</td>
                                <td style="padding: 10px 12px; text-align: right; color: #666;">₹${order.pricing?.deliveryFee}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding: 10px 12px; color: #666;">Packaging Fee</td>
                                <td style="padding: 10px 12px; text-align: right; color: #666;">₹${order.pricing?.packagingFee}</td>
                            </tr>
                            ${order.pricing?.discount > 0 ? `
                            <tr>
                                <td colspan="2" style="padding: 10px 12px; color: #00a651;">Discount</td>
                                <td style="padding: 10px 12px; text-align: right; color: #00a651;">-₹${order.pricing?.discount}</td>
                            </tr>` : ""}
                            <tr class="total-row">
                                <td colspan="2">Total Amount</td>
                                <td style="text-align: right;">₹${order.pricing?.total}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="footer">
                    <p>© 2025 Foodie. All Rights Reserved.</p>
                    <p>Questions? Contact us at foodie@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
        `
    });
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOrderStatusEmail,
    sendWelcomeEmail,
    sendOrderReceiptEmail
};