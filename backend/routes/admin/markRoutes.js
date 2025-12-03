// backend/routes/admin/markRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  getMarks,
  getMarkById,
  createMark,
  updateMark,
  deleteMark,
  bulkDeleteMarks,
} from "../../controllers/admin/markController.js";

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
      message: "Invalid mark ID",
    });
  }
  next();
};

/* ============================================================
   AUTHENTICATION (ADMIN PANEL)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   VIEW MARKS (ADMIN + TEACHER + STUDENT + PARENT)
   NOTE: Service layer enforces teacher/student/parent restrictions
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  getMarks
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  validateId,
  getMarkById
);

/* ============================================================
   CREATE / UPDATE / DELETE (ADMIN + TEACHER)
   Service ensures teachers can only modify marks for their classes
============================================================ */
router.post("/", requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]), createMark);

router.put(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateMark
);

router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  deleteMark
);

/* ============================================================
   BULK DELETE (ADMIN ONLY)
============================================================ */
router.post(
  "/bulk-delete",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  bulkDeleteMarks
);

export default router;
