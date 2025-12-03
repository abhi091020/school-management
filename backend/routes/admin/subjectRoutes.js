// routes/admin/subjectRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkDeleteSubjects,
} from "../../controllers/admin/subjectController.js";

import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize as requireRoles } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/* ============================================================
   Validate ObjectId
============================================================ */
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subject ID",
    });
  }
  next();
};

/* ============================================================
   ADMIN PANEL AUTH (SESSION-BASED)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   READ — Admin, Teacher, Student, Parent
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  getSubjects
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  validateId,
  getSubjectById
);

/* ============================================================
   WRITE — Admin Only
============================================================ */
router.post("/", requireRoles(["ADMIN", "SUPER_ADMIN"]), createSubject);

router.put(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  validateId,
  updateSubject
);

router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  validateId,
  deleteSubject
);

router.post(
  "/bulk-delete",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  bulkDeleteSubjects
);

export default router;
