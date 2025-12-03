// backend/config/db.js

import mongoose from "mongoose";
import logger from "../utils/logger.js"; // Ensure to use .js extension for local imports in ESM

/**
 * @desc MongoDB production connection
 * - Prevents silent failures
 * - Blocks server start until DB is ready
 * - Provides clean & readable logging
 * - Graceful shutdown handler
 */

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info("MongoDB already connected — reusing existing connection.");
    return;
  }

  try {
    // Global recommended safe settings
    mongoose.set("strictQuery", true);
    // Use `process.env.NODE_ENV !== "production"` for autoIndex
    mongoose.set("autoIndex", process.env.NODE_ENV !== "production");
    mongoose.set("bufferTimeoutMS", 30000);

    if (process.env.NODE_ENV !== "production") {
      mongoose.set("debug", true);
    }

    // Establish connection
    // Ensure you use the correct environment variable key (MONGO_URI)
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 15,
      minPoolSize: 3,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 8000,
      family: 4, // Force IPv4 for better compatibility
    });

    isConnected = true;

    console.log(`✅ MongoDB connected → ${conn.connection.host}`);
    logger.info(`MongoDB connected → ${conn.connection.host}`);

    return conn;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    logger.error("MongoDB Connection Error", { message: err.message });

    // Prevent infinite retry loops — fail fast in production
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }

    // In development: retry every 3 seconds
    console.log("🔁 Retrying MongoDB connection in 3 seconds...");
    setTimeout(connectDB, 3000);
  }
};

/**
 * @desc Graceful shutdown (PM2 / Docker / Heroku / Hostinger)
 */
const gracefulExit = async () => {
  try {
    console.log("⚠️  Shutting down MongoDB connection...");
    await mongoose.connection.close();
    console.log("🔌 MongoDB disconnected.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during DB shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulExit);
process.on("SIGTERM", gracefulExit);

// FIX: Change to ES Module default export
export default connectDB;
