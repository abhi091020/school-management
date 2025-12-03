// routes/admin/timetableRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  getTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  bulkDeleteTimetables,
} from "../../controllers/admin/timetableController.js";

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
      message: "Invalid timetable ID",
    });
  }
  next();
};

/* ============================================================
   ADMIN PANEL AUTH — SESSION-BASED
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   READ — Admin, Teacher, Student, Parent
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  getTimetables
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  validateId,
  getTimetableById
);

/* ============================================================
   WRITE — Admin + Teacher
============================================================ */
router.post(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  createTimetable
);

router.patch(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateTimetable
);

router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  deleteTimetable
);

/* ============================================================
   BULK DELETE — Admin Only
============================================================ */
router.post(
  "/bulk-delete",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  bulkDeleteTimetables
);

export default router;
