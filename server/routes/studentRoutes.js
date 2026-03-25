import express from "express";
import {
  getDashboard,
  getNotifications,
  getNotification,
  getAttendance,
  getFees
} from "../controllers/studentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Dashboard
router.get("/dashboard", getDashboard);

// Notifications (Plans)
router.get("/notifications", getNotifications);
router.get("/notifications/:notificationId", getNotification);

// Attendance
router.get("/attendance", getAttendance);

// Fees
router.get("/fees", getFees);

export default router;