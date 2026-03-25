import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  admissionNumber: { type: String, unique: true, required: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "student"], default: "student" },
  type: { type: String, enum: ["monthly", "membership"] },
  joinDate: { type: Date, default: Date.now },
  phone: String,
  age: Number,
  profilePicture: String
}, { timestamps: true });

export default mongoose.model("User", userSchema);