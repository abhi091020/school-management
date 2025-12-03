// backend/middlewares/rateLimitMiddleware.js

import rateLimit from "express-rate-limit"; // FIX: Use ES Module import
import logger from "../utils/logger.js"; // FIX: Use ES Module import

// --------------------------------------------------
// Unified IP extractor (works behind nginx, cloudflare)
// --------------------------------------------------
const getIP = (req) =>
  req.headers["cf-connecting-ip"] ||
  req.headers["x-real-ip"] ||
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.ip;

// --------------------------------------------------
// Shared base configuration (production-grade)
// --------------------------------------------------
const baseConfig = {
  standardHeaders: "draft-7",
  legacyHeaders: false,

  handler: (req, res, next, options) => {
    const ip = getIP(req);

    logger.warn({
      event: "RATE_LIMIT_HIT",
      ip,
      path: req.originalUrl,
      method: req.method,
      userAgent: req.headers["user-agent"],
    });

    return res.status(options.statusCode || 429).json({
      success: false,
      message: options.message || "Too many requests. Please try again later.",
    });
  },

  skipFailedRequests: false,
  skipSuccessfulRequests: false,
};

// --------------------------------------------------
// Disable rate-limits in NON-PRODUCTION environments
// --------------------------------------------------
const applyLimiter = (config) => {
  if (process.env.NODE_ENV !== "production") {
    return (req, res, next) => next(); // disable limiter in dev
  }
  return rateLimit(config);
};

// --------------------------------------------------
// API General Limiter
// --------------------------------------------------
export const apiLimiter = applyLimiter({
  // FIX: Use named export
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  ...baseConfig,
});

// --------------------------------------------------
// Login brute-force limiter
// --------------------------------------------------
export const loginLimiter = applyLimiter({
  // FIX: Use named export
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later.",
  ...baseConfig,
});

// --------------------------------------------------
// OTP limiter
// --------------------------------------------------
export const otpLimiter = applyLimiter({
  // FIX: Use named export
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests. Please wait before retrying.",
  ...baseConfig,
});

// FIX: Removed module.exports, replaced with inline named exports.
