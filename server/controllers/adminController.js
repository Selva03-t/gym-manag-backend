import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Fees from "../models/Fees.js";
import Plan from "../models/Plan.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Get Dashboard Overview
export const getDashboardOverview = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAttendanceToday = await Attendance.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    const presentToday = await Attendance.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) },
      status: "present"
    });
    const absentToday = totalAttendanceToday - presentToday;
    
    // Get count of students with pending fees
    const pendingFeesList = await Fees.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$studentId" } }
    ]);
    const pendingFeesCount = pendingFeesList.length;
    
    const paidFees = await Fees.countDocuments({ status: "paid" });
    const totalDueAmount = await Fees.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalStudents,
      totalAttendanceToday,
      presentToday,
      absentToday,
      pendingFeesCount,
      paidFees,
      totalDueAmount: totalDueAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
};

// Add Student
export const addStudent = async (req, res) => {
  try {
    const { admissionNumber, name, email, password, type, phone } = req.body;

    if (!admissionNumber || !name || !email || !password) {
      return res.status(400).json({ message: "Registration number, name, email, and password are required" });
    }

    // Check if registration number already exists
    const existingAdmissionNumber = await User.findOne({ admissionNumber });
    if (existingAdmissionNumber) {
      return res.status(400).json({ message: "Registration number already exists" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const student = new User({
      admissionNumber,
      name,
      email,
      password: hashed,
      role: "student",
      type: type || "monthly",
      phone
    });

    await student.save();
    
    // Return student without password
    const studentResponse = {
      _id: student._id,
      admissionNumber: student.admissionNumber,
      name: student.name,
      email: student.email,
      role: student.role,
      type: student.type,
      phone: student.phone,
      joinDate: student.joinDate
    };
    
    res.json(studentResponse);
  } catch (error) {
    res.status(500).json({ message: "Error adding student", error: error.message });
  }
};

// Get Students
export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
};

// Get Single Student Details with Attendance and Fees
export const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const student = await User.findById(studentId).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendance = await Attendance.find({ studentId });
    const fees = await Fees.find({ studentId });
    const plans = await Plan.find({ studentId }).sort({ sentDate: -1 });

    res.json({
      student,
      attendance,
      fees,
      plans,
      attendanceStats: {
        total: attendance.length,
        present: attendance.filter(a => a.status === "present").length,
        absent: attendance.filter(a => a.status === "absent").length
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching student details", error: error.message });
  }
};

// Mark Attendance
export const markAttendance = async (req, res) => {
  try {
    const { admissionNumber, date, status } = req.body;

    if (!admissionNumber || !status) {
      return res.status(400).json({ message: "Admission number and status are required" });
    }

    if (!["present", "absent"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'present' or 'absent'" });
    }

    // Find student by admission number
    const student = await User.findOne({ admissionNumber });
    if (!student) {
      return res.status(404).json({ message: "Student not found with the given admission number" });
    }

    const studentId = student._id;

    const existingRecord = await Attendance.findOne({
      studentId,
      date: date ? new Date(date) : { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    if (existingRecord) {
      existingRecord.status = status;
      await existingRecord.save();
      return res.json(existingRecord);
    }

    const record = new Attendance({
      studentId,
      admissionNumber: student.admissionNumber,
      studentName: student.name,
      date: date || new Date(),
      status
    });

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

// Update Fees
export const updateFees = async (req, res) => {
  try {
    const { admissionNumber, type, amount, status, dueDate } = req.body;

    if (!admissionNumber || !type || !amount || !status) {
      return res.status(400).json({ message: "All fields (admission number, type, amount, status) are required" });
    }

    if (!["paid", "pending"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'paid' or 'pending'" });
    }

    // Find student by admission number
    const student = await User.findOne({ admissionNumber });
    if (!student) {
      return res.status(404).json({ message: "Student not found with the given admission number" });
    }

    const studentId = student._id;

    const fees = new Fees({
      studentId,
      admissionNumber: student.admissionNumber,
      studentName: student.name,
      type,
      amount,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      paidDate: status === "paid" ? new Date() : null
    });

    await fees.save();
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: "Error updating fees", error: error.message });
  }
};

// Get Student Fees History
export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const fees = await Fees.find({ studentId }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fees", error: error.message });
  }
};

// Assign Plan (Workout & Diet)
export const assignPlan = async (req, res) => {
  try {
    const { admissionNumber, workout, diet } = req.body;

    if (!admissionNumber || !workout || !diet) {
      return res.status(400).json({ message: "Admission number, workout, and diet are required" });
    }

    if (!diet.breakfast || !diet.lunch || !diet.dinner) {
      return res.status(400).json({ message: "Diet must include breakfast, lunch, and dinner" });
    }

    // Find student by admission number
    const student = await User.findOne({ admissionNumber });
    if (!student) {
      return res.status(404).json({ message: "Student not found with the given admission number" });
    }

    const studentId = student._id;

    const plan = new Plan({
      studentId,
      admissionNumber: student.admissionNumber,
      studentName: student.name,
      workout,
      diet: {
        breakfast: diet.breakfast,
        lunch: diet.lunch,
        dinner: diet.dinner
      }
    });

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error assigning plan", error: error.message });
  }
};

// Get all plans for a student
export const getStudentPlans = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    const plans = await Plan.find({ studentId }).sort({ sentDate: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans", error: error.message });
  }
};

// Get students with pending fees
export const getStudentsWithPendingFees = async (req, res) => {
  try {
    const pendingFeeStudentIds = await Fees.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$studentId" } }
    ]);

    const studentIds = pendingFeeStudentIds.map(f => f._id);
    const students = await User.find({ _id: { $in: studentIds }, role: "student" }).select("-password");
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students with pending fees", error: error.message });
  }
};

// Get students present today
export const getStudentsPresentToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentAttendanceIds = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
          status: "present"
        }
      },
      { $group: { _id: "$studentId" } }
    ]);

    const studentIds = presentAttendanceIds.map(a => a._id);
    const students = await User.find({ _id: { $in: studentIds }, role: "student" }).select("-password");
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching present students", error: error.message });
  }
};

// Get students absent today
export const getStudentsAbsentToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const absentAttendanceIds = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
          status: "absent"
        }
      },
      { $group: { _id: "$studentId" } }
    ]);

    const studentIds = absentAttendanceIds.map(a => a._id);
    const students = await User.find({ _id: { $in: studentIds }, role: "student" }).select("-password");
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching absent students", error: error.message });
  }
};