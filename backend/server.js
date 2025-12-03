/**************************************************************
 * LOAD ENV + VALIDATE ESSENTIAL VARIABLES
 **************************************************************/
import "dotenv/config";

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "SESSION_FINGERPRINT_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ ERROR: Missing required env variable: ${key}`);
    process.exit(1);
  }
}

/**************************************************************
 * IMPORTS
 **************************************************************/
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import parseQueryMiddleware from "./middlewares/parseQueryMiddleware.js";
import logger from "./utils/logger.js";
import baseApp from "./app.js";

/**************************************************************
 * RESOLVE __dirname (ESM Safe)
 **************************************************************/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**************************************************************
 * COPY QUERY → req.modelQuery (GET-only)
 **************************************************************/
function attachModelQueryMiddleware(req, res, next) {
  if (req.method === "GET") {
    req.modelQuery = { ...req.query };
  }
  next();
}

/**************************************************************
 * APP INSTANCE
 **************************************************************/
const app = baseApp;

/**************************************************************
 * ENTERPRISE-GRADE CORS CONFIG
 **************************************************************/
const allowedOrigins = [
  process.env.CLIENT_URL, // Production frontend
  "http://localhost:5173", // Local Vite frontend
  /\.vercel\.app$/, // All Vercel preview deployments
  /\.onrender\.com$/, // If frontend ever runs on Render
];

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // Allow non-browser requests (curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins.some((entry) => {
      if (!entry) return false;
      if (typeof entry === "string") return entry === origin;
      if (entry instanceof RegExp) return entry.test(origin);
      return false;
    });

    if (allowed) {
      callback(null, true);
    } else {
      console.log("❌ CORS BLOCKED:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
};

/**************************************************************
 * INITIALIZE MIDDLEWARE
 **************************************************************/
function initializeMiddleware() {
  logger.info("⚙️ Initializing middleware...");

  app.set("trust proxy", 1);
  app.use(cookieParser());

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // <<< ENTERPRISE CORS >>>
  app.use(cors(corsOptions));

  // Security hardening (adjusted for API usage)
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Prevent HTTP parameter pollution
  app.use(hpp());

  app.use(parseQueryMiddleware);
  app.use(attachModelQueryMiddleware);

  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  }
}

/**************************************************************
 * SAFE ROUTE LOADER WITH LOGGING
 **************************************************************/
async function safeLoadRoute(relativePath) {
  logger.info(`🔍 Loading route: ${relativePath}`);

  try {
    const absolutePath = path.join(__dirname, relativePath);
    const fileUrl = pathToFileURL(absolutePath).href;

    const module = await import(fileUrl);
    const route = module.default ?? module;

    if (!route || typeof route.use !== "function") {
      logger.error(`❌ Invalid router export → ${relativePath}`);
      return null;
    }

    logger.info(`✅ Route loaded: ${relativePath}`);
    return route;
  } catch (err) {
    logger.error(
      `❌ Failed to load route: ${relativePath}\nError: ${err.message}\nStack: ${err.stack}`
    );
    return null;
  }
}

/**************************************************************
 * INITIALIZE ROUTES
 **************************************************************/
async function initializeRoutes() {
  logger.info("🚀 Loading all routes...");

  // Health Check
  app.get("/api/health", (req, res) =>
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  );

  /**************** AUTH ROUTES ****************/
  const adminAuth = await safeLoadRoute("./routes/admin/authRoutes.js");
  if (adminAuth) app.use("/api/admin/auth", adminAuth);

  const publicAuth = await safeLoadRoute("./routes/public/authRoutes.js");
  if (publicAuth) app.use("/api/auth", publicAuth);

  /**************** ADMIN USER ROUTES ****************/
  const userRoutes = await safeLoadRoute("./routes/admin/userRoutes.js");
  if (userRoutes) app.use("/api/admin/users", userRoutes);

  /**************** OTHER ADMIN ROUTES ****************/
  const adminRoutes = [
    ["classes", "./routes/admin/classRoutes.js"],
    ["subjects", "./routes/admin/subjectRoutes.js"],
    ["attendance", "./routes/admin/attendanceRoutes.js"],
    ["exams", "./routes/admin/examRoutes.js"],
    ["marks", "./routes/admin/markRoutes.js"],
    ["timetables", "./routes/admin/timetableRoutes.js"],
    ["fees", "./routes/admin/feeRoutes.js"],
    ["notifications", "./routes/admin/notificationRoutes.js"],
    ["events", "./routes/admin/eventRoutes.js"],
    ["feedbacks", "./routes/admin/feedbackRoutes.js"],
  ];

  for (const [name, rel] of adminRoutes) {
    const route = await safeLoadRoute(rel);
    if (!route) continue;
    app.use(`/api/admin/${name}`, route);
  }

  /**************** RECYCLE BIN + HISTORY ****************/
  const recycleBin = await safeLoadRoute("./routes/admin/recycleBinRoutes.js");
  if (recycleBin) app.use("/api/admin/recycle-bin", recycleBin);

  const recycleHistory = await safeLoadRoute(
    "./routes/admin/recycleHistoryRoute.js"
  );
  if (recycleHistory) app.use("/api/admin/recycle-history", recycleHistory);

  /**************** STUDENT / EMPLOYEE / PARENT ****************/
  const student = await safeLoadRoute("./routes/student/studentRoutes.js");
  if (student) app.use("/api/student", student);

  const employeeRoute = await safeLoadRoute(
    "./routes/employee/employeeRoutes.js"
  );
  if (employeeRoute) app.use("/api/employee", employeeRoute);

  const parent = await safeLoadRoute("./routes/parent/parentRoutes.js");
  if (parent) app.use("/api/parent", parent);

  logger.info("✅ All routes loaded successfully.");

  /**************** 404 HANDLER ****************/
  app.use((req, res) => {
    logger.warn(`⚠️ Route not found → ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.originalUrl}`,
    });
  });

  /**************** GLOBAL ERROR HANDLER ****************/
  app.use(errorHandler);
}

/**************************************************************
 * START SERVER
 **************************************************************/
async function startServer() {
  try {
    logger.info("🔌 Connecting to MongoDB...");
    await connectDB();

    initializeMiddleware();
    await initializeRoutes();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, "0.0.0.0", () =>
      logger.info(`✅ Server running on PORT ${PORT}`)
    );

    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled Rejection", err);
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception", err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    logger.error("❌ Fatal startup error:", err);
    process.exit(1);
  }
}

startServer();
