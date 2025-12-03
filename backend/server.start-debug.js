// server.start-debug.js
// Temporary diagnostic starter — find silent crashes.
// Run: node server.start-debug.js

process.on("uncaughtException", (err) => {
  console.error("🔥 Startup Crash → Uncaught Exception:\n", err.stack || err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 Startup Crash → Unhandled Rejection:\n", err.stack || err);
  process.exit(1);
});

require("dotenv").config();
console.log("DEBUG: .env loaded");

const safe = (name, loader) => {
  try {
    console.log(`\n🔍 Loading: ${name}`);
    loader();
    console.log(`✅ Loaded OK: ${name}`);
  } catch (err) {
    console.error(`❌ CRASHED while loading: ${name}\n`);
    console.error(err.stack || err);
    process.exit(1);
  }
};

/* ============================
   TEST IMPORTS ONE BY ONE
=============================== */

safe("express", () => require("express"));
safe("cors", () => require("cors"));
safe("helmet", () => require("helmet"));
safe("morgan", () => require("morgan"));
safe("xss-clean", () => require("xss-clean"));
safe("hpp", () => require("hpp"));
safe("cookie-parser", () => require("cookie-parser"));

safe("db.js", () => require("./config/db"));
safe("errorMiddleware.js", () => require("./middlewares/errorMiddleware"));
safe("logger.js", () => require("./utils/logger"));
safe("rateLimiter.js", () => require("./middlewares/rateLimiter"));
safe("sessionMiddleware.js", () => require("./middlewares/sessionMiddleware"));

/* ============================
   TEST ROUTE IMPORTS (MODELS LOAD HERE)
=============================== */

safe("authRoutes", () => require("./routes/authRoutes"));
safe("admin/userRoutes", () => require("./routes/admin/userRoutes"));
safe("admin/classRoutes", () => require("./routes/admin/classRoutes"));
safe("admin/subjectRoutes", () => require("./routes/admin/subjectRoutes"));
safe("admin/attendanceRoutes", () =>
  require("./routes/admin/attendanceRoutes")
);
safe("admin/examRoutes", () => require("./routes/admin/examRoutes"));
safe("admin/markRoutes", () => require("./routes/admin/markRoutes"));
safe("admin/timetableRoutes", () => require("./routes/admin/timetableRoutes"));
safe("admin/feeRoutes", () => require("./routes/admin/feeRoutes"));
safe("admin/notificationRoutes", () =>
  require("./routes/admin/notificationRoutes")
);
safe("admin/eventRoutes", () => require("./routes/admin/eventRoutes"));
safe("admin/feedbackRoutes", () => require("./routes/admin/feedbackRoutes"));

console.log("\n🎉 All imports succeeded — no route-level crashes.\n");

// Minimal server spin-up just to verify runtime safety
const express = require("express");
const app = express();

app.get("/__debug__ping", (req, res) =>
  res.json({ ok: true, time: Date.now() })
);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`DEBUG: Express started on port ${PORT}`);
  server.close(() => {
    console.log("DEBUG: Express closed.");
    console.log("\n🟢 Diagnostic complete.");
    process.exit(0);
  });
});
