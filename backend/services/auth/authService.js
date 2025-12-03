// backend/services/auth/authService.js

import User from "../../models/admin/User.js";
import { throwError } from "../../utils/response.js";
import {
  generateAuthTokens,
  destroySession,
  revokeAllUserSessions,
} from "../../utils/tokenService.js";

import sendEmail from "../../utils/sendEmail.js";
import crypto from "crypto";

/* ============================================================================
   HELPER — SANITIZE USER OBJECT
============================================================================ */
const safeUser = (user) => {
  if (!user) return null;

  const obj = user.toObject ? user.toObject() : user;

  delete obj.password;
  delete obj.resetPasswordOTPHash;
  delete obj.resetPasswordOTPSalt;
  delete obj.resetPasswordOTPExpiry;
  delete obj.resetPasswordOTPAttempts;
  delete obj.canResetPassword;
  delete obj.__v;

  return obj;
};

/* ============================================================================
   PASSWORD POLICY (Enterprise)
============================================================================ */
const validatePasswordStrength = (password) => {
  const strong =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!strong.test(password)) {
    throwError(
      "Password must be at least 8 characters and include upper/lowercase, number, and special character.",
      400
    );
  }
};

/* ============================================================================
   1. PUBLIC LOGIN (Student / Parent / Teacher)
============================================================================ */
export const loginUser = async (email, password, req) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  }).select("+password +role");

  if (!user) throwError("Invalid login credentials.", 401);

  const match = await user.comparePassword(password);
  if (!match) throwError("Invalid login credentials.", 401);

  if (user.status !== "active") {
    throwError(`Account is ${user.status}. Contact administrator.`, 403);
  }

  const tokens = await generateAuthTokens(user, req);

  return {
    user: safeUser(user),
    ...tokens,
  };
};

/* ============================================================================
   2. ADMIN LOGIN — Hardened
============================================================================ */
export const loginAdmin = async (email, password, req) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  }).select("+password +role");

  if (!user) throwError("Invalid Admin credentials.", 401);

  const match = await user.comparePassword(password);
  if (!match) throwError("Invalid Admin credentials.", 401);

  if (user.status !== "active") {
    throwError(`Account is ${user.status}. Contact super admin.`, 403);
  }

  // Roles stored lowercase in DB
  const allowed = ["admin", "super_admin"];
  if (!allowed.includes(user.role)) {
    throwError("Access denied. Admin privileges required.", 403);
  }

  // IMPORTANT: Revoke all existing admin sessions before creating a new one
  await revokeAllUserSessions(user._id, "admin-login-revoke");

  const tokens = await generateAuthTokens(user, req);

  return {
    user: safeUser(user),
    ...tokens,
  };
};

/* ============================================================================
   3. LOGOUT
============================================================================ */
export const logoutUser = async (refreshToken) => {
  return destroySession(refreshToken);
};

/* ============================================================================
   4. SEND PASSWORD RESET OTP
============================================================================ */
export const requestPasswordResetService = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  });

  if (!user) return;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", salt).update(otp).digest("hex");

  user.resetPasswordOTPSalt = salt;
  user.resetPasswordOTPHash = hash;
  user.resetPasswordOTPExpiry = Date.now() + 10 * 60 * 1000;
  user.resetPasswordOTPAttempts = 0;
  user.canResetPassword = false;

  await user.save();

  const html = `
    <div style="font-family:Arial; background:#f6f6f6; padding:20px;">
      <div style="max-width:480px; margin:auto; background:white; padding:30px; border-radius:10px;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:8px;">${otp}</h1>
        <p>Valid for 10 minutes.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "Password Reset OTP",
    html,
  });
};

/* ============================================================================
   5. VERIFY OTP
============================================================================ */
export const verifyOTPService = async (email, otp) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  });

  if (
    !user ||
    !user.resetPasswordOTPHash ||
    Date.now() > user.resetPasswordOTPExpiry
  ) {
    throwError("Invalid or expired OTP.", 400);
  }

  const hash = crypto
    .createHmac("sha256", user.resetPasswordOTPSalt)
    .update(otp)
    .digest("hex");

  if (hash !== user.resetPasswordOTPHash) {
    user.resetPasswordOTPAttempts = (user.resetPasswordOTPAttempts || 0) + 1;

    if (user.resetPasswordOTPAttempts > 5) {
      user.resetPasswordOTPExpiry = Date.now() - 1;
      await user.save();
      throwError("Too many attempts. Request new OTP.", 403);
    }

    await user.save();
    throwError("Invalid OTP.", 400);
  }

  user.canResetPassword = true;
  user.resetPasswordOTPHash = undefined;
  user.resetPasswordOTPSalt = undefined;
  user.resetPasswordOTPExpiry = undefined;
  user.resetPasswordOTPAttempts = 0;

  await user.save();
};

/* ============================================================================
   6. RESET PASSWORD
============================================================================ */
export const resetPasswordService = async (email, newPassword) => {
  validatePasswordStrength(newPassword);

  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  }).select("+password");

  if (!user || !user.canResetPassword) {
    throwError("OTP verification required before resetting password.", 403);
  }

  user.password = newPassword;
  user.canResetPassword = false;
  user.isFirstLogin = false;

  await user.save();

  await revokeAllUserSessions(user._id, "password-reset");

  return true;
};

/* ============================================================================
   7. AUTHENTICATED PASSWORD CHANGE
============================================================================ */
export const changePasswordAndRevoke = async (
  userId,
  oldPassword,
  newPassword
) => {
  validatePasswordStrength(newPassword);

  const user = await User.findById(userId).select("+password");

  if (!user || user.isDeleted) throwError("User not found.", 404);

  const match = await user.comparePassword(oldPassword);
  if (!match) throwError("Incorrect old password.", 401);

  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();

  await revokeAllUserSessions(userId, "password-change");

  return true;
};
