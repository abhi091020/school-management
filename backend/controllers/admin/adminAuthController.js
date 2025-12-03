// backend/controllers/admin/adminAuthController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import { handleValidation, cookieOptions } from "../../utils/authUtils.js";

import { loginAdmin, logoutUser } from "../../services/auth/authService.js";
import { refreshAuthTokens } from "../../utils/tokenService.js";

/* ============================================================================
   1. ADMIN LOGIN (Session-Based)
   - Admin uses long-lived refresh token (365 days)
   - JWT access token optional for admin panel requests
============================================================================ */
export const login = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginAdmin(
    email,
    password,
    req
  );

  // Secure HTTP-only refresh cookie (1 year)
  res.cookie("refreshToken", refreshToken, cookieOptions(365));

  return res.status(200).json({
    success: true,
    message: "Admin login successful",
    accessToken,
    token: accessToken,
    user,
  });
});

/* ============================================================================
   2. GET CURRENT AUTHENTICATED ADMIN
   - Works with sessionMiddleware (no JWT required)
============================================================================ */
export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) throwError("Authentication required.", 401);

  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

/* ============================================================================
   3. ADMIN LOGOUT (Session Revoke)
============================================================================ */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await logoutUser(refreshToken); // Marks session invalid
  }

  // Remove cookie securely
  res.cookie("refreshToken", "", { ...cookieOptions(0), maxAge: 0 });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

/* ============================================================================
   4. ADMIN REFRESH TOKEN
   - Secure rotation
   - Fingerprint validation
   - Reuse-attack detection
============================================================================ */
export const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;

  if (!oldRefreshToken) {
    throwError("Session expired. Please log in again.", 401);
  }

  try {
    const { accessToken, refreshToken, user } = await refreshAuthTokens(
      oldRefreshToken,
      req
    );

    // Always set 1-year refresh for admin
    res.cookie("refreshToken", refreshToken, cookieOptions(365));

    return res.status(200).json({
      success: true,
      message: "Access token refreshed.",
      accessToken,
      token: accessToken,
      user,
    });
  } catch (err) {
    // Handles:
    // - reuse attack
    // - expired session
    // - fingerprint mismatch
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message || "Invalid session",
    });
  }
});
