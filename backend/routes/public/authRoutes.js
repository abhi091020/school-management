// backend/routes/public/authRoutes.js

import express from "express";
import { body } from "express-validator";

// Controllers
import {
  login,
  logout,
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  changePassword,
  refreshToken,
} from "../../controllers/auth/publicAuthController.js";

// Middleware
import { protect } from "../../middlewares/authMiddleware.js";
import asyncHandler from "../../middlewares/asyncHandler.js";

const router = express.Router();

/* ============================================================
   VALIDATION RULES
============================================================ */
const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const otpValidation = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("otp")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP must be 4–6 digits."),
];

const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

const changePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Old password is required."),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters."),
];

/* ============================================================
   PUBLIC ROUTES
============================================================ */

// LOGIN
router.post("/login", loginValidation, asyncHandler(login));

// LOGOUT
router.post("/logout", asyncHandler(logout));

// REQUEST OTP RESET
router.post(
  "/password/forgot",
  [body("email").isEmail().withMessage("Valid email required.")],
  asyncHandler(requestPasswordReset)
);

// VERIFY OTP
router.post("/password/verify-otp", otpValidation, asyncHandler(verifyOTP));

// RESET PASSWORD
router.post(
  "/password/reset",
  resetPasswordValidation,
  asyncHandler(resetPassword)
);

/* ============================================================
   AUTHENTICATED ROUTES (JWT Only)
============================================================ */

// CHANGE PASSWORD (Protected)
router.post(
  "/password/change",
  protect,
  changePasswordValidation,
  asyncHandler(changePassword)
);

/* ============================================================
   SHARED REFRESH ROUTE (Public + Admin)
============================================================ */
router.post("/refresh", asyncHandler(refreshToken));

export default router;
