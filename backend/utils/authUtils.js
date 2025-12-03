// backend/utils/authUtils.js

import { validationResult } from "express-validator";
import { throwError } from "./response.js";

/* ========================================================================
   VALIDATION HANDLER (Reusable)
   Throws 422 with structured error payload
========================================================================= */
export const handleValidation = (req) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const formatted = result.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.errors = formatted;
    throw error;
  }
};

/* ========================================================================
   COOKIE OPTIONS — PRODUCTION READY
   Safe for Admin Panel and JWT Refresh Flows
========================================================================= */

/**
 * Generate secure cookie options for refresh token.
 *
 * - Development:
 *     secure = false (HTTP allowed)
 *     sameSite = lax (cross-port allowed)
 *
 * - Production:
 *     secure = true (HTTPS required)
 *     sameSite = strict (CSRF protection)
 *
 * - TTL:
 *     days < 1 used for immediate deletion (logout)
 */

export const cookieOptions = (days = 7) => {
  const isProd = process.env.NODE_ENV === "production";

  // Calculate expiry (0 days = immediate removal)
  const expires =
    days <= 0
      ? new Date(Date.now() - 10 * 1000)
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const options = {
    expires,
    httpOnly: true, // Prevent JS access
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  };

  /**
   * Optional: support subdomains if your deployment uses:
   *   - admin.example.com
   *   - api.example.com
   *   - student.example.com
   *
   * Set COOKIE_DOMAIN in production:
   *   COOKIE_DOMAIN=.example.com
   */
  if (process.env.COOKIE_DOMAIN && isProd) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};
