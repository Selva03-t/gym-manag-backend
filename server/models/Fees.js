import mongoose from "mongoose";

const feesSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admissionNumber: { type: String, required: true },
  studentName: { type: String, required: true },
  type: { type: String, enum: ["monthly", "membership"], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["paid", "pending"], default: "pending" },
  dueDate: Date,
  paidDate: Date,
  expiryDate: Date
}, { timestamps: true });

export default mongoose.model("Fees", feesSchema);