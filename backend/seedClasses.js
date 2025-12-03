// seedClasses.js
import mongoose from "mongoose";
// Make sure this path is correct relative to where you run the script (e.g., node seedClasses.js)
import Class from "./models/admin/Class.js";

// 🛑 FIX: Using the correct Atlas URI from your .env file
const DB_URI =
  "mongodb+srv://schoolsystem:school%40123@school.8ad3zfq.mongodb.net/School?retryWrites=true&w=majority";

async function seedClass() {
  try {
    await mongoose.connect(DB_URI);
    console.log("✅ MongoDB connected to Atlas for seeding.");

    const classData = {
      name: "Grade 1",
      section: "A",
      classTeacher: null,
      subjects: [],
      students: [],
    };

    const existingClass = await Class.findOne({
      name: classData.name,
      section: classData.section,
      isDeleted: false,
    });

    if (existingClass) {
      console.log(
        `⚠️ Class ${classData.name}-${classData.section} already exists. Skipping insertion.`
      );
      return;
    }

    const newClass = await Class.create(classData);
    console.log(`🚀 Successfully inserted new Class: ${newClass._id}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔗 Connection closed.");
  }
}

seedClass();
