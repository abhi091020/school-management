const mongoose = require("mongoose");
const User = require("../models/admin/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("DB Connected");

  await User.deleteMany({ email: "abhishekbhore9@gmail.com" });

  const admin = new User({
    userId: "ADM001",
    name: "Admin",
    email: "abhishekbhore9@gmail.com",
    password: "Admin@123", // ← WILL BE HASHED AUTOMATICALLY
    role: "admin",
    status: "active",
  });

  await admin.save();
  console.log("Admin created successfully!");
  console.log(admin);

  process.exit();
});
