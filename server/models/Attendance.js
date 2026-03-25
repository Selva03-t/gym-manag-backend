import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admissionNumber: { type: String, required: true },
  studentName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["present", "absent"], required: true }
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);