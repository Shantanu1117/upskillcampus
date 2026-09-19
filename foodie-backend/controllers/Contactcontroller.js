const ContactMessage = require("../models/Contactmessage");
const { sendEmail } = require("../utils/emailUtils");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// POST /api/contact (public)
const submitContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return sendError(res, 400, "Name, email and message are required");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendError(res, 400, "Please provide a valid email address");
        }

        const contactMessage = await ContactMessage.create({ name, email, subject, message });

        // Best-effort notification to support — never fail the request over this.
        try {
            await sendEmail({
                to: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
                subject: `New Contact Form Message: ${subject || "General Inquiry"}`,
                html: `
                    <h2>New message from the Foodie contact form</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                `,
                text: `New message from ${name} (${email}): ${message}`
            });
        } catch (emailErr) {
            console.error("Contact notification email failed:", emailErr.message);
        }

        return sendSuccess(res, 201, "Message sent successfully", { contactmessage });

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { submitContactmessage };
