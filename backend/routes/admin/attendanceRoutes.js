// backend/routes/admin/attendanceRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  bulkDeleteAttendance,
} from "../../controllers/admin/attendanceController.js";

import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize as requireRoles } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/* ============================================================
   VALIDATE MONGO OBJECT ID
============================================================ */
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};

/* ============================================================
   AUTHENTICATION (Admin Panel)
   sessionMiddleware validates refresh-token cookie + rotates access token.
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   READ — ADMIN + SUPER_ADMIN + TEACHER
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  getAttendance
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  getAttendanceById
);

/* ============================================================
   CREATE / UPDATE — ADMIN + TEACHER
   Teachers can mark & update attendance but not delete permanently
============================================================ */
router.post(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  createAttendance
);

router.patch(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateAttendance
);

/* ============================================================
   DELETE — ADMIN ONLY
============================================================ */
router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  validateId,
  deleteAttendance
);

/* ============================================================
   BULK DELETE — SUPER_ADMIN ONLY (Enterprise standard)
============================================================ */
router.post(
  "/bulk-delete",
  requireRoles(["SUPER_ADMIN"]),
  bulkDeleteAttendance
);

export default router;
