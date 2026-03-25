import express from "express";
import {
  addStudent,
  getStudents,
  markAttendance,
  updateFees,
  assignPlan,
  getDashboardOverview,
  getStudentDetails,
  getStudentFees,
  getStudentPlans,
  getStudentsWithPendingFees,
  getStudentsPresentToday,
  getStudentsAbsentToday
} from "../controllers/adminController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

// Dashboard
router.get("/dashboard", getDashboardOverview);

// Students
router.post("/add-student", addStudent);
router.get("/students", getStudents);
router.get("/students/filter/pending-fees", getStudentsWithPendingFees);
router.get("/students/filter/present-today", getStudentsPresentToday);
router.get("/students/filter/absent-today", getStudentsAbsentToday);
router.get("/students/:studentId", getStudentDetails);

// Attendance
router.post("/attendance", markAttendance);

// Fees
router.post("/fees", updateFees);
router.get("/fees/:studentId", getStudentFees);

// Plans
router.post("/plan", assignPlan);
router.get("/plans/:studentId", getStudentPlans);

export default router;