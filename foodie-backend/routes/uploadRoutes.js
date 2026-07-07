const express = require("express");
const router = express.Router();
const {
    uploadImage,
    uploadMultipleImages,
    deleteImage
} = require("../controllers/uploadController");

const { protect } = require("../middlewares/authMiddleware");
const {
    handleSingleUpload,
    handleMultipleUpload
} = require("../middlewares/uploadMiddleware");

router.use(protect);

router.post("/image", handleSingleUpload, uploadImage);
router.post("/images", handleMultipleUpload, uploadMultipleImages);
router.delete("/image/:publicId", deleteImage);

module.exports = router;