// backend/middlewares/authMiddleware.js

import User from "../models/admin/User.js";
import { verifyAccessToken } from "../utils/tokenService.js";
import asyncHandler from "./asyncHandler.js";

/**
 * IMPORTANT:
 * This middleware protects JWT-based APIs (Student / Parent / Teacher).
 * Admin panel uses sessionMiddleware instead (NOT JWT).
 */

const FIRST_LOGIN_BYPASS = ["/api/auth/logout", "/api/auth/change-password"];

/* ============================================================================
 *  JWT PROTECTION (Student / Parent / Teacher APIs)
============================================================================ */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract Bearer token safely
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token missing. Please log in.",
      code: "TOKEN_MISSING",
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.sub) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
      code: "TOKEN_INVALID",
    });
  }

  const user = await User.findOne({
    _id: decoded.sub,
    isDeleted: false,
    status: "active",
  }).select("_id name email role isFirstLogin");

  if (!user) {
    return res.status(403).json({
      success: false,
      message: "User account unavailable or inactive",
      code: "USER_INACTIVE",
    });
  }

  const currentPath = req.path;
  const isBypassed = FIRST_LOGIN_BYPASS.some((route) =>
    currentPath.startsWith(route)
  );

  if (user.isFirstLogin && !isBypassed) {
    return res.status(403).json({
      success: false,
      message: "You must change your default password before continuing.",
      code: "MUST_CHANGE_PASSWORD",
    });
  }

  req.user = user;
  req.userId = String(user._id);
  req.userRole = String(user.role).toUpperCase();

  // Prevent caching protected data
  res.setHeader("Cache-Control", "no-store");

  next();
});

/* ============================================================================
 *  ROLE-BASED ACCESS CONTROL (RBAC)
 *  FIXED: Prevents crashes if roles are invalid, nested, or missing.
============================================================================ */
export const authorize = (...roles) => {
  // Flatten → Filter valid strings → Normalize case
  const normalizedRoles = roles
    .flat() // flatten nested arrays
    .filter((r) => typeof r === "string") // only valid strings
    .map((r) => r.toUpperCase()); // normalize

  if (normalizedRoles.length === 0) {
    throw new Error("authorize() requires at least one valid role string");
  }

  return (req, res, next) => {
    const role =
      req.userRole || (req.user?.role && String(req.user.role).toUpperCase());

    if (!role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    if (!normalizedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
        code: "FORBIDDEN",
      });
    }

    return next();
  };
};
