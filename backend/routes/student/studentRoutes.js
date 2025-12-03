// backend/routes/student/studentRoutes.js

import express from "express";

// Controllers
import {
  getStudentProfile,
  updateStudentContact,
} from "../../controllers/student/studentController.js";

// Middlewares
import { protect, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * ============================================================================
 * STUDENT ROUTES
 * Access: Authenticated users with role = STUDENT
 * ============================================================================
 */
router.use(protect, authorize("STUDENT"));

/**
 * GET /api/student/profile
 * PATCH /api/student/profile
 */
router.route("/profile").get(getStudentProfile).patch(updateStudentContact);

export default router;
