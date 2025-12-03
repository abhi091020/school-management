// backend/routes/admin/authRoutes.js

import express from "express";
import { body } from "express-validator";

import {
  login,
  getMe,
  logout,
} from "../../controllers/admin/adminAuthController.js";

import { refreshToken } from "../../controllers/auth/publicAuthController.js";

import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/* ======================================================
   ADMIN LOGIN
====================================================== */
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  login
);

/* ======================================================
   REFRESH TOKEN (Public)
====================================================== */
router.post("/refresh", refreshToken);

/* ======================================================
   PROTECTED ADMIN ROUTES
====================================================== */
router.use(sessionMiddleware);

/* GET LOGGED-IN ADMIN */
router.get("/me", authorize("admin", "super_admin"), getMe);

/* LOGOUT */
router.post("/logout", authorize("admin", "super_admin"), logout);

export default router;
