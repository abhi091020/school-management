// backend/routes/admin/notificationRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  bulkDeleteNotifications,
} from "../../controllers/admin/notificationController.js";

import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize as requireRoles } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/* ============================================================
   VALIDATE OBJECT ID
============================================================ */
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID",
    });
  }
  next();
};

/* ============================================================
   AUTHENTICATION (ADMIN PANEL)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   READ: ALL AUTHENTICATED USERS
   (Admin/Teacher/Student/Parent)
============================================================ */
router.get("/", getNotifications);
router.get("/:id", validateId, getNotificationById);

/* ============================================================
   CREATE / UPDATE / DELETE — ADMIN + TEACHER
============================================================ */
router.post(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  createNotification
);

router.put(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateNotification
);

router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  deleteNotification
);

/* ============================================================
   BULK DELETE — ADMIN ONLY
============================================================ */
router.post(
  "/bulk-delete",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  bulkDeleteNotifications
);

/* ============================================================
   MARK READ — ANY AUTHENTICATED USER
============================================================ */
router.post("/:id/read", validateId, updateNotification);

export default router;
