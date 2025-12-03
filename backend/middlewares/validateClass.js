// backend/middlewares/sessionMiddleware.js

import Session from "../models/Session.js";
import User from "../models/admin/User.js";
import logger from "../utils/logger.js";

/* ==========================================================
   IP Normalization
========================================================== */
function normalizeIP(ip) {
  if (!ip) return ip;
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}

const getIP = (req) => {
  let ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.ip ||
    req.connection.remoteAddress;

  return normalizeIP(ip);
};

/* ==========================================================
   MAIN SESSION MIDDLEWARE (Custom JWT/Refresh Token Logic)
========================================================== */
async function sessionMiddleware(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Not logged in
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No active session",
      });
    }

    // Validate session
    const sessionDoc = await Session.findOne({ refreshToken, isValid: true });
    if (!sessionDoc) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    // Expired
    if (sessionDoc.expiresAt < new Date()) {
      sessionDoc.isValid = false;
      await sessionDoc.save();

      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // DEVELOPMENT: relax security
    const clientIP = getIP(req);
    const storedIP = normalizeIP(sessionDoc.ip);
    const clientUA = req.headers["user-agent"];
    const storedUA = sessionDoc.userAgent;

    // Advanced User-Agent check (base UA stripping)
    const baseUA = (ua) => ua.replace(/ Chrome\/[\d.]+/, "");
    const uaMismatch =
      storedUA && clientUA && baseUA(storedUA) !== baseUA(clientUA);

    // Security Check: IP and User-Agent mismatch
    if (process.env.NODE_ENV === "production") {
      // Allow for potential IP changes (e.g., mobile networks) but keep UA strict
      if (storedIP !== clientIP || uaMismatch) {
        logger.warn("Suspicious activity detected", {
          sessionId: sessionDoc._id,
          clientIP,
          storedIP,
          uaMismatch,
        });
        sessionDoc.isValid = false;
        await sessionDoc.save();
        return res.status(401).json({
          success: false,
          message: "Suspicious activity detected",
        });
      }
    }

    // Load user
    const user = await User.findOne({
      _id: sessionDoc.userId,
      isDeleted: false,
    });

    if (!user || user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User inactive or unavailable",
      });
    }

    // Keep session alive (update lastActivity)
    sessionDoc.lastActivity = new Date();
    await sessionDoc.save();

    // Attach context to request
    req.session = sessionDoc;
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (err) {
    logger.error("Session check failed:", err);
    // Use the error middleware for clean handling if possible
    next(err);
  }
}

// FIX: Change to ES Module default export
export default sessionMiddleware;
