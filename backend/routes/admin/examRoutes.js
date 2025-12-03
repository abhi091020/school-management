// backend/routes/admin/examRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  bulkDeleteExams,
} from "../../controllers/admin/examController.js";

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
      message: "Invalid exam ID",
    });
  }
  next();
};

/* ============================================================
   AUTHENTICATION (ADMIN PANEL)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   VIEW — ADMIN, TEACHER, STUDENT, PARENT
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  getExams
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  validateId,
  getExamById
);

/* ============================================================
   CREATE / UPDATE / DELETE — ADMIN + SUPER_ADMIN + TEACHER
============================================================ */
router.post("/", requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]), createExam);

router.patch(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateExam
);

router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  deleteExam
);

/* ============================================================
   BULK DELETE — ADMIN + SUPER_ADMIN ONLY
============================================================ */
router.post(
  "/bulk-delete",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  bulkDeleteExams
);

export default router;
