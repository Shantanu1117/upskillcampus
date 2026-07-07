const express = require("express");
const router = express.Router();
const {
    sendNotification,
    broadcastNotification,
    deleteNotification,
    getAllNotifications
} = require("../controllers/notificationController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/all", getAllNotifications);
router.post("/send", sendNotification);
router.post("/broadcast", broadcastNotification);
router.delete("/:id", deleteNotification);

module.exports = router;