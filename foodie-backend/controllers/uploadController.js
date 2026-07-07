const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// POST /api/upload/image
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 400, "No image file provided");
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "foodie",
            resource_type: "image",
            transformation: [
                { width: 800, height: 600, crop: "limit" },
                { quality: "auto" },
                { format: "webp" }
            ]
        });

        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        return sendSuccess(res, 200, "Image uploaded successfully", {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        });

    } catch (error) {
        // Clean up local file if upload failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return sendError(res, 500, error.message);
    }
};

// POST /api/upload/images (multiple)
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return sendError(res, 400, "No image files provided");
        }

        const uploadPromises = req.files.map(file =>
            cloudinary.uploader.upload(file.path, {
                folder: "foodie",
                resource_type: "image",
                transformation: [
                    { width: 800, height: 600, crop: "limit" },
                    { quality: "auto" },
                    { format: "webp" }
                ]
            })
        );

        const results = await Promise.all(uploadPromises);

        // Delete local files
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });

        const urls = results.map(result => ({
            url: result.secure_url,
            publicId: result.public_id
        }));

        return sendSuccess(res, 200, "Images uploaded successfully", { urls });

    } catch (error) {
        // Clean up local files
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        return sendError(res, 500, error.message);
    }
};

// DELETE /api/upload/image/:publicId
const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return sendError(res, 400, "Public ID required");
        }

        await cloudinary.uploader.destroy(publicId);

        return sendSuccess(res, 200, "Image deleted successfully");

    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { uploadImage, uploadMultipleImages, deleteImage };