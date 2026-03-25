import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./server/models/User.js";
import Attendance from "./server/models/Attendance.js";
import Fees from "./server/models/Fees.js";
import Plan from "./server/models/Plan.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const run = async () => {
  try {
    // Create Admin
    const adminExists = await User.findOne({ email: "admin@gym.com" });
    if (!adminExists) {
      const hashedAdmin = await bcrypt.hash("admin123", 10);
      const admin = await User.create({
        name: "Admin User",
        email: "admin@gym.com",
        password: hashedAdmin,
        role: "admin"
      });
      console.log("✅ Admin created:", admin.email);
    } else {
      console.log("✅ Admin already exists");
    }

    // Create Demo Students
    const studentEmails = ["student@gym.com", "john@gym.com", "sarah@gym.com"];
    
    for (let idx = 0; idx < studentEmails.length; idx++) {
      const email = studentEmails[idx];
      const studentExists = await User.findOne({ email });
      if (!studentExists) {
        const hashedPassword = await bcrypt.hash("student123", 10);
        const student = await User.create({
          admissionNumber: `ADM${Date.now()}${idx}`,
          name: email.split("@")[0].toUpperCase(),
          email,
          password: hashedPassword,
          role: "student",
          type: "monthly",
          age: Math.floor(Math.random() * (35 - 18 + 1)) + 18
        });
        console.log("✅ Student created:", student.email);

        // Add sample attendance for this student
        for (let i = 0; i < 10; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          await Attendance.create({
            studentId: student._id,
            admissionNumber: student.admissionNumber,
            studentName: student.name,
            date,
            status: Math.random() > 0.2 ? "present" : "absent"
          });
        }

        // Add sample fees
        await Fees.create({
          studentId: student._id,
          admissionNumber: student.admissionNumber,
          studentName: student.name,
          type: "monthly",
          amount: 500,
          status: Math.random() > 0.5 ? "paid" : "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Add sample plan
        await Plan.create({
          studentId: student._id,
          admissionNumber: student.admissionNumber,
          studentName: student.name,
          workout: "30 min cardio + 20 min chest workout",
          diet: {
            breakfast: "2 eggs, whole wheat toast, orange juice",
            lunch: "Grilled chicken, brown rice, steamed broccoli",
            dinner: "Tuna salad with olive oil dressing"
          }
        });

        console.log("  ✓ Added attendance, fees, and plan");
      } else {
        console.log("✅ Student already exists:", email);
      }
    }

    console.log("\n🎉 Database setup completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

run();