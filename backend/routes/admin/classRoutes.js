// backend/routes/admin/classRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../../controllers/admin/classController.js";

// Middlewares
import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize } from "../../middlewares/authMiddleware.js";
import validateClass from "../../middlewares/validateClass.js";

const router = express.Router();

/* ============================================================
   VALIDATE MONGO OBJECT ID
============================================================ */
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid class ID",
    });
  }
  next();
};

/* ============================================================
   DISABLE CACHE
============================================================ */
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.set("Pragma", "no-cache");
  next();
});

/* ============================================================
   SESSION AUTH (Admin Panel Only)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   READ — ADMIN, SUPER_ADMIN, TEACHER
============================================================ */
router.get("/", authorize("ADMIN", "SUPER_ADMIN", "TEACHER"), getAllClasses);

router.get(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN", "TEACHER"),
  validateId,
  getClassById
);

/* ============================================================
   WRITE — ADMIN, SUPER_ADMIN
============================================================ */
router.post("/", authorize("ADMIN", "SUPER_ADMIN"), validateClass, createClass);

router.patch(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateId,
  updateClass
);

router.delete(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateId,
  deleteClass
);

export default router;
