import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admissionNumber: { type: String, required: true },
  studentName: { type: String, required: true },
  sentDate: { type: Date, default: Date.now },
  workout: { type: String, required: true },
  diet: {
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    dinner: { type: String, required: true }
  },
  title: { type: String, default: "Workout & Diet Plan" }
}, { timestamps: true });

export default mongoose.model("Plan", planSchema);