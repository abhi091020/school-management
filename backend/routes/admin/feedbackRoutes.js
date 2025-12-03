// backend/routes/admin/feedbackRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
} from "../../controllers/admin/feedbackController.js";

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
      message: "Invalid feedback ID",
    });
  }
  next();
};

/* ============================================================
   AUTHENTICATION (ADMIN PANEL)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   CREATE FEEDBACK (ALL AUTHENTICATED ROLES)
============================================================ */
router.post(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT", "STUDENT"]),
  createFeedback
);

/* ============================================================
   LIST FEEDBACKS (ADMIN + TEACHER)
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  getFeedbacks
);

/* ============================================================
   GET SINGLE FEEDBACK (ALL AUTH USERS)
============================================================ */
router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT", "STUDENT"]),
  validateId,
  getFeedbackById
);

/* ============================================================
   UPDATE FEEDBACK STATUS (ADMIN + TEACHER)
============================================================ */
router.patch(
  "/:id/status",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateFeedbackStatus
);

/* ============================================================
   DELETE FEEDBACK (ADMIN + TEACHER)
============================================================ */
router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  deleteFeedback
);

export default router;
