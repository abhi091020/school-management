// backend/utils/logger.js — Enterprise-Grade Logger

import winston from "winston";
import "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Ensure /logs directory exists safely
// ============================================================================
const logDir = path.join(__dirname, "..", "logs");

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error("❌ Failed to create logs directory:", err);
}

// ============================================================================
// Safe Transport Wrapper — ensures logger never crashes
// ============================================================================
const safeDailyRotate = (opts) => {
  try {
    return new winston.transports.DailyRotateFile(opts);
  } catch (err) {
    console.error("❌ DailyRotate initialization failed:", err);
    return new winston.transports.File({
      filename: path.join(logDir, "fallback.log"),
      level: opts.level || "info",
    });
  }
};

// ============================================================================
// Unified JSON Log Format (Production Safe)
// ============================================================================
const jsonLogFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
  winston.format.json()
);

// ============================================================================
// Logger Instance
// ============================================================================
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: jsonLogFormat,
  transports: [
    // Application Logs
    safeDailyRotate({
      filename: path.join(logDir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
    }),

    // Error Logs Only
    safeDailyRotate({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      zippedArchive: true,
    }),
  ],
});

// ============================================================================
// Console Transport (Enabled in DEV Only)
// ============================================================================
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(
          ({ timestamp, level, message, metadata, stack }) => {
            const meta =
              metadata && Object.keys(metadata).length
                ? `\n.meta ${JSON.stringify(metadata)}`
                : "";

            return `[${timestamp}] ${level}: ${stack || message}${meta}`;
          }
        )
      ),
    })
  );
}

// ============================================================================
// Crash Handling (Uncaught Exceptions & Promise Rejections)
// ============================================================================
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, "exceptions.log"),
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, "rejections.log"),
  })
);

export default logger;
