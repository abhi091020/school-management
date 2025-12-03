// backend/routes/admin/eventRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../../controllers/admin/eventController.js";

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
      message: "Invalid event ID",
    });
  }
  next();
};

/* ============================================================
   ADMIN PANEL AUTHENTICATION
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   VIEW EVENTS — ADMIN, SUPER_ADMIN, TEACHER, PARENT
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT"]),
  getEvents
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT"]),
  validateId,
  getEventById
);

/* ============================================================
   CREATE / UPDATE EVENTS — ADMIN + SUPER_ADMIN + TEACHER
============================================================ */
router.post(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  createEvent
);

router.patch(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  updateEvent
);

/* ============================================================
   DELETE EVENTS — ADMIN + SUPER_ADMIN ONLY
============================================================ */
router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  validateId,
  deleteEvent
);

export default router;
