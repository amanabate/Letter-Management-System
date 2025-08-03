import express from "express";
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/", createNotification);
router.get("/user/:userId", getUserNotifications);
router.put("/:notificationId/read", markAsRead);
router.put("/user/:userId/read-all", markAllAsRead);
router.delete("/:notificationId", deleteNotification);

export default router;
