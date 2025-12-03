// backend/middlewares/sessionMiddleware.js

import Session from "../models/Session.js";
import User from "../models/admin/User.js";
import logger from "../utils/logger.js";
import { cookieOptions } from "../utils/authUtils.js";

/* ============================================================================
 *  IP NORMALIZATION HELPERS
============================================================================ */
function normalizeIP(ip) {
  if (!ip) return ip;
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}

const getClientIP = (req) => {
  const raw =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.ip ||
    req.connection?.remoteAddress;

  return normalizeIP(raw);
};

/* ============================================================================
 *  ADMIN PANEL SESSION MIDDLEWARE
 *  This middleware authenticates admin panel routes ONLY.
============================================================================ */
async function sessionMiddleware(req, res, next) {
  const refreshToken = req.cookies?.refreshToken;

  // No cookie = no session → continue without auth
  if (!refreshToken) return next();

  try {
    /* ------------------------------------------------------------------------
     * 1. Validate Session Exists
    -------------------------------------------------------------------------*/
    const sessionDoc = await Session.findOne({
      refreshToken,
      isValid: true,
    }); // IMPORTANT: No .lean()

    if (!sessionDoc) {
      res.clearCookie("refreshToken", cookieOptions(0));
      return res.status(401).json({
        success: false,
        message: "Session invalid or revoked.",
      });
    }

    /* ------------------------------------------------------------------------
     * 2. Expiry Validation
    -------------------------------------------------------------------------*/
    if (sessionDoc.expiresAt < new Date()) {
      sessionDoc.isValid = false;
      sessionDoc.revokedAt = new Date();
      sessionDoc.revokedReason = "expired";
      await sessionDoc.save();

      res.clearCookie("refreshToken", cookieOptions(0));

      return res.status(401).json({
        success: false,
        message: "Session expired.",
      });
    }

    /* ------------------------------------------------------------------------
     * 3. Session Integrity Validation (Production Only)
    -------------------------------------------------------------------------*/
    if (process.env.NODE_ENV === "production") {
      const reqIP = getClientIP(req);
      const savedIP = normalizeIP(sessionDoc.ip);

      const reqUA = req.headers["user-agent"] || "";
      const savedUA = sessionDoc.userAgent || "";

      const stripUA = (ua) =>
        ua ? ua.replace(/ Chrome\/[\d.]+/, "").replace(/ Edg\/[\d.]+/, "") : ua;

      if (reqIP !== savedIP || stripUA(reqUA) !== stripUA(savedUA)) {
        logger.warn(
          `Admin Session mismatch detected for user ${sessionDoc.userId}`
        );

        sessionDoc.isValid = false;
        sessionDoc.revokedAt = new Date();
        sessionDoc.revokedReason = "security-violation";
        await sessionDoc.save();

        res.clearCookie("refreshToken", cookieOptions(0));

        return res.status(401).json({
          success: false,
          message: "Session mismatch detected.",
        });
      }
    }

    /* ------------------------------------------------------------------------
     * 4. Load Attached User
    -------------------------------------------------------------------------*/
    const user = await User.findOne({
      _id: sessionDoc.userId,
      isDeleted: false,
      status: "active",
    }).select("_id name email role status");

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User unavailable or inactive.",
      });
    }

    /* ------------------------------------------------------------------------
     * 5. Enforce: Only Admin/Super_Admin can use this Middleware
    -------------------------------------------------------------------------*/
    if (!["admin", "super_admin"].includes(user.role)) {
      logger.warn(
        `Unauthorized role attempted admin session access: ${user.role}`
      );

      return res.status(403).json({
        success: false,
        message: "Only Admin users may access this panel.",
      });
    }

    /* ------------------------------------------------------------------------
     * 6. Attach Auth Context
    -------------------------------------------------------------------------*/
    req.session = sessionDoc;
    req.user = user;
    req.userId = String(user._id);
    req.userRole = user.role.toUpperCase();

    res.setHeader("Cache-Control", "no-store");

    return next();
  } catch (err) {
    logger.error("Session middleware error:", err);
    res.clearCookie("refreshToken", cookieOptions(0));
    next(err);
  }
}

export default sessionMiddleware;
