// backend/controllers/auth/publicAuthController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import { handleValidation, cookieOptions } from "../../utils/authUtils.js";

import {
  loginUser,
  logoutUser,
  requestPasswordResetService,
  verifyOTPService,
  resetPasswordService,
  changePasswordAndRevoke,
} from "../../services/auth/authService.js";

import { refreshAuthTokens } from "../../utils/tokenService.js";

/* ============================================================================
   1. PUBLIC LOGIN (Student / Teacher / Parent)
   JWT Authentication
============================================================================ */
export const login = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginUser(
    email,
    password,
    req
  );

  // Set secure Refresh Token as HTTP-only cookie
  res.cookie("refreshToken", refreshToken, cookieOptions(30));

  // Important: never expose sensitive fields (password, session info, etc.)
  return res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    token: accessToken, // FE compatibility
    user,
  });
});

/* ============================================================================
   2. LOGOUT (Session Invalidate + Cookie Clear)
============================================================================ */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await logoutUser(refreshToken); // soft invalidate session entry
  }

  // Remove cookie safely
  res.cookie("refreshToken", "", { ...cookieOptions(0), maxAge: 0 });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

/* ============================================================================
   3. SEND PASSWORD RESET OTP
============================================================================ */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { email } = req.body;

  await requestPasswordResetService(email);

  return res.status(200).json({
    success: true,
    message: "If this email exists, an OTP has been sent.",
  });
});

/* ============================================================================
   4. VERIFY OTP
============================================================================ */
export const verifyOTP = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { email, otp } = req.body;

  await verifyOTPService(email, otp);

  return res.status(200).json({
    success: true,
    message: "OTP verified. You may reset your password now.",
  });
});

/* ============================================================================
   5. RESET PASSWORD (Forgot Password)
============================================================================ */
export const resetPassword = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { email, newPassword } = req.body;

  await resetPasswordService(email, newPassword);

  return res.status(200).json({
    success: true,
    message: "Password reset successful. Please log in.",
  });
});

/* ============================================================================
   6. CHANGE PASSWORD (JWT + Revoke ALL Sessions)
============================================================================ */
export const changePassword = asyncHandler(async (req, res) => {
  handleValidation(req);

  const userId = req.user?._id;
  if (!userId) throwError("Authentication required.", 401);

  const { oldPassword, newPassword } = req.body;

  await changePasswordAndRevoke(userId, oldPassword, newPassword);

  // Remove all refresh cookie sessions
  res.cookie("refreshToken", "", { ...cookieOptions(0), maxAge: 0 });

  return res.status(200).json({
    success: true,
    message:
      "Password changed successfully. Please log in with your new password.",
  });
});

/* ============================================================================
   7. REFRESH TOKEN (JWT + Session Rotation)
============================================================================ */
export const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    });
  }

  try {
    const { accessToken, refreshToken, user } = await refreshAuthTokens(
      oldRefreshToken,
      req
    );

    const role = user.role?.toLowerCase();
    const expiry = role === "admin" || role === "super_admin" ? 365 : 30;

    res.cookie("refreshToken", refreshToken, cookieOptions(expiry));

    return res.status(200).json({
      success: true,
      message: "Access token refreshed.",
      accessToken,
      token: accessToken,
      user,
    });
  } catch (err) {
    // Handle session reuse / invalidation cleanly
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message || "Invalid refresh token",
    });
  }
});
