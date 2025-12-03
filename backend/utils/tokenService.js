// backend/utils/tokenService.js

import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import User from "../models/admin/User.js";
import logger from "./logger.js";
import { throwError } from "./response.js";

/* ============================================================================
   CONFIG
============================================================================ */
const ACCESS_TTL = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS, 10) || 30;
const REFRESH_BYTES = 64;
const REUSE_WINDOW_MS = 5000;

const JWT_SECRET = process.env.JWT_SECRET;
const FINGERPRINT_SECRET = process.env.SESSION_FINGERPRINT_SECRET;

// Validate required secrets
if (!JWT_SECRET && process.env.NODE_ENV !== "test") {
  logger.error("JWT_SECRET missing");
  throw new Error("JWT_SECRET is required");
}

if (!FINGERPRINT_SECRET && process.env.NODE_ENV !== "test") {
  logger.error("SESSION_FINGERPRINT_SECRET missing");
  throw new Error("SESSION_FINGERPRINT_SECRET is required");
}

/* ============================================================================
   HELPERS
============================================================================ */

// Normalize IP formats (ipv6 → ipv4)
const normalizeIP = (ip) => {
  if (!ip) return "";
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
};

const getClientIP = (req) => {
  const raw =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.ip ||
    req.connection?.remoteAddress ||
    "";
  return normalizeIP(raw);
};

const getClientUA = (req) => {
  const raw = req.headers["user-agent"] || "Unknown";
  // strip unstable Chrome version numbers
  return raw.replace(/ Chrome\/[\d.]+/, "");
};

// HMAC fingerprint to prevent spoofing
const createFingerprint = (ip, ua, userId) => {
  const raw = `${normalizeIP(ip)}|${ua}|${userId}|${FINGERPRINT_SECRET}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

const refreshExpiry = (role) => {
  const normalized = String(role || "").toUpperCase();
  const longLived = normalized === "ADMIN" || normalized === "SUPER_ADMIN";

  const days = longLived ? 365 : REFRESH_DAYS;
  return new Date(Date.now() + days * 86400000);
};

/* ============================================================================
   ACCESS TOKEN
============================================================================ */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role, // safe — RBAC ignores token role
      iss: "school-mgmt-core",
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TTL,
      algorithm: "HS256",
    }
  );
};

/* ============================================================================
   LOGIN → CREATE SESSION + TOKEN PAIR
============================================================================ */
export const generateAuthTokens = async (user, req) => {
  const refreshToken = crypto.randomBytes(REFRESH_BYTES).toString("hex");

  const ip = getClientIP(req);
  const ua = getClientUA(req);

  const fingerprint = createFingerprint(ip, ua, user._id.toString());
  const expiresAt = refreshExpiry(user.role);

  // Destroy older sessions with same fingerprint
  await Session.updateMany(
    { userId: user._id, fingerprint, isValid: true },
    {
      $set: {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: "new-session-created",
      },
    }
  );

  await Session.create({
    userId: user._id,
    refreshToken,
    fingerprint,
    ip,
    userAgent: ua,
    lastActivity: new Date(),
    expiresAt,
    isValid: true,
  });

  return {
    accessToken: generateAccessToken(user),
    refreshToken,
  };
};

/* ============================================================================
   VERIFY ACCESS TOKEN
============================================================================ */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
};

/* ============================================================================
   VALIDATE REFRESH SESSION
============================================================================ */
export const validateRefreshSession = async (token) => {
  // 1. Fresh session
  const session = await Session.findOne({
    refreshToken: token,
    isValid: true,
  }).lean();

  if (session) {
    if (session.expiresAt < new Date()) {
      // Auto-expire
      await Session.updateOne(
        { _id: session._id },
        {
          $set: {
            isValid: false,
            revokedAt: new Date(),
            revokedReason: "expired",
          },
        }
      );
      return null;
    }

    return { type: "VALID", session };
  }

  // 2. Recently rotated (reuse-attacks)
  const recent = await Session.findOne({
    refreshToken: token,
    isValid: false,
    revokedReason: "new-session-created",
    revokedAt: { $gte: new Date(Date.now() - REUSE_WINDOW_MS) },
  }).lean();

  if (recent) {
    return { type: "REUSED_RECENTLY", session: recent };
  }

  return null;
};

/* ============================================================================
   ROTATE REFRESH TOKEN
============================================================================ */
export const rotateRefreshToken = async (session, req) => {
  const user = await User.findById(session.userId).lean();

  if (!user || user.status !== "active") {
    throwError("User unavailable or inactive.", 403);
  }

  const newToken = crypto.randomBytes(REFRESH_BYTES).toString("hex");

  const ip = getClientIP(req);
  const ua = getClientUA(req);
  const fingerprint = createFingerprint(ip, ua, user._id.toString());
  const expiresAt = refreshExpiry(user.role);

  await Session.updateOne(
    { _id: session._id, isValid: true },
    {
      $set: {
        refreshToken: newToken,
        fingerprint,
        ip,
        userAgent: ua,
        lastActivity: new Date(),
        rotatedAt: new Date(),
        expiresAt,
      },
    }
  );

  return {
    accessToken: generateAccessToken(user),
    refreshToken: newToken,
    user,
  };
};

/* ============================================================================
   REFRESH TOKEN ENDPOINT LOGIC
============================================================================ */
export const refreshAuthTokens = async (oldToken, req) => {
  const result = await validateRefreshSession(oldToken);

  if (!result) {
    throwError("Invalid or expired refresh token. Please log in again.", 401);
  }

  if (result.type === "REUSED_RECENTLY") {
    // Reuse → kill all sessions (security policy)
    await Session.updateMany(
      { userId: result.session.userId, isValid: true },
      {
        $set: {
          isValid: false,
          revokedAt: new Date(),
          revokedReason: "reuse-detected",
        },
      }
    );
    throwError("Security violation detected. Please log in again.", 403);
  }

  return rotateRefreshToken(result.session, req);
};

/* ============================================================================
   LOGOUT
============================================================================ */
export const destroySession = async (refreshToken) => {
  await Session.updateOne(
    { refreshToken },
    {
      $set: {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: "logout",
      },
    }
  );
  return true;
};

/* ============================================================================
   REVOKE ALL USER SESSIONS
============================================================================ */
export const revokeAllUserSessions = async (
  userId,
  reason = "force-revoke"
) => {
  await Session.updateMany(
    { userId, isValid: true },
    {
      $set: {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
  return true;
};
