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
 * RESOLVE __dirname (Windows + ESM Safe)
 **************************************************************/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**************************************************************
 * COPY QUERY → modelQuery (GET-only)
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
 * SAFE ROUTE LOADER (ESM + Windows Safe)
 **************************************************************/
async function safeLoadRoute(relativePath) {
  try {
    const absolutePath = path.join(__dirname, relativePath);
    const fileUrl = pathToFileURL(absolutePath).href;

    const module = await import(fileUrl);
    const route = module.default ?? module;

    // FIX: Express router is a FUNCTION with .use()
    const isRouter = route && typeof route.use === "function";

    if (!isRouter) {
      logger.error(
        `Invalid router export (not an Express router) → ${relativePath}`
      );
      return null;
    }

    logger.debug(`Route loaded → ${relativePath}`);
    return route;
  } catch (err) {
    logger.error(`Failed to load route → ${relativePath}`, {
      error: err.message,
      stack: err.stack,
    });
    return null;
  }
}

/**************************************************************
 * INITIALIZE MIDDLEWARE
 **************************************************************/
function initializeMiddleware() {
  logger.info("Initializing middleware...");

  app.set("trust proxy", 1);
  app.use(cookieParser());

  // 🔥 FIX APPLIED HERE: Body parsers moved to run immediately after cookies,
  // before CORS, Helmet, and custom middlewares. This ensures req.body is populated.
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    })
  );

  app.use(hpp());

  app.use(parseQueryMiddleware);
  app.use(attachModelQueryMiddleware);

  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  }
}

/**************************************************************
 * INITIALIZE ROUTES
 **************************************************************/
async function initializeRoutes() {
  logger.info("Loading routes...");

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

  /**************** ADMIN ROUTES ****************/

  // 🚀 FIX: Load and mount the userRoutes explicitly at /api/admin/users
  // All user-related routes (including /students and /parents) should now resolve correctly.
  const userRoutes = await safeLoadRoute("./routes/admin/userRoutes.js");
  if (userRoutes) app.use("/api/admin/users", userRoutes); // <-- FIXED MOUNTING

  // Load other admin routes dynamically
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
    if (!route) {
      logger.error(`Skipping admin route (failed to load) → ${rel}`);
      continue;
    }
    // These routes are mounted at /api/admin/{name}
    app.use(`/api/admin/${name}`, route);
  }
  logger.info("Admin routes loaded dynamically.");

  /**************** RECYCLE BIN / HISTORY ****************/
  const recycleBin = await safeLoadRoute("./routes/admin/recycleBinRoutes.js");
  if (recycleBin) app.use("/api/admin/recycle-bin", recycleBin);

  const recycleHistory = await safeLoadRoute(
    "./routes/admin/recycleHistoryRoute.js"
  );
  if (recycleHistory) app.use("/api/admin/recycle-history", recycleHistory);

  /**************** STUDENT / EMPLOYEE / PARENT ****************/
  const student = await safeLoadRoute("./routes/student/studentRoutes.js");
  if (student) app.use("/api/student", student);

  // FIX: Renamed 'teacher' constant to 'employeeRoute' and mounted to '/api/employee'
  // for better alignment with the EmployeeProfile model, which covers both teachers and admins.
  const employeeRoute = await safeLoadRoute(
    "./routes/employee/employeeRoutes.js"
  );
  if (employeeRoute) app.use("/api/employee", employeeRoute);

  const parent = await safeLoadRoute("./routes/parent/parentRoutes.js");
  if (parent) app.use("/api/parent", parent);

  /**************** 404 HANDLER ****************/
  app.use((req, res) => {
    logger.warn(`Route not found → ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.originalUrl}`,
    });
  });

  /**************** GLOBAL ERROR HANDLER ****************/
  app.use(errorHandler);
}

// ----------------------------------------------------------------------------

/**************************************************************
 * START SERVER
 **************************************************************/
async function startServer() {
  try {
    logger.info("Connecting to MongoDB...");
    await connectDB();

    initializeMiddleware();
    await initializeRoutes();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () =>
      logger.info(`Server running on port ${PORT}`)
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
    logger.error("Fatal startup error:", err);
    process.exit(1);
  }
}

startServer();
