import Attendance from "../models/Attendance.js";
import Fees from "../models/Fees.js";
import Plan from "../models/Plan.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Get Dashboard Data
export const getDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student info
    const student = await User.findById(studentId).select("-password");

    // Get attendance
    const attendance = await Attendance.find({ studentId }).sort({ date: -1 });
    const presentCount = attendance.filter(a => a.status === "present").length;
    const absentCount = attendance.filter(a => a.status === "absent").length;

    // Get fees
    const fees = await Fees.find({ studentId }).sort({ createdAt: -1 });
    const latestFee = fees[0] || null;

    // Get latest plan/notifications (3 most recent)
    const plans = await Plan.find({ studentId }).sort({ sentDate: -1 }).limit(3);

    res.json({
      student,
      attendance: {
        total: attendance.length,
        present: presentCount,
        absent: absentCount
      },
      fees: {
        latest: latestFee,
        all: fees
      },
      notifications: plans
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard", error: error.message });
  }
};

// Get All Notifications (Plans) for Student
export const getNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const plans = await Plan.find({ studentId }).sort({ sentDate: -1 });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// Get Single Notification
export const getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid notificationId" });
    }

    const plan = await Plan.findOne({ _id: notificationId, studentId });

    if (!plan) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notification", error: error.message });
  }
};

// Get Student Attendance
export const getAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attendance = await Attendance.find({ studentId }).sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance", error: error.message });
  }
};

// Get Student Fees
export const getFees = async (req, res) => {
  try {
    const studentId = req.user.id;

    const fees = await Fees.find({ studentId }).sort({ createdAt: -1 });

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fees", error: error.message });
  }
};