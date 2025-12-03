// backend/routes/employee/employeeRoutes.js

import express from "express";

import {
  getEmployeeProfile,
  updateEmployeeProfileDetails,
} from "../../controllers/employee/employeeController.js";

import { protect, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * ============================================================================
 * EMPLOYEE SELF-SERVICE ROUTES
 * Access: Authenticated users with role = TEACHER or ADMIN
 * ============================================================================
 */
// Protect and authorize all routes in this file for TEACHER or ADMIN
router.use(protect, authorize("TEACHER", "ADMIN"));

/**
 * GET /api/employee/profile - Retrieve own profile
 * PATCH /api/employee/profile - Update own contact/address
 */
router
  .route("/profile")
  .get(getEmployeeProfile)
  .patch(updateEmployeeProfileDetails);

export default router;
