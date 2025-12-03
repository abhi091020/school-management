// backend/routes/admin/userRoutes.js (FIXED ORDER)

import express from "express";
const router = express.Router();

/* CONTROLLERS */
import * as userController from "../../controllers/admin/userController.js";
import * as studentController from "../../controllers/student/studentController.js";
import * as parentController from "../../controllers/parent/parentController.js";
import * as employeeController from "../../controllers/employee/employeeController.js";

/* MIDDLEWARES */
import { protect, authorize } from "../../middlewares/authMiddleware.js";
import {
  validateCreateUser,
  validateUpdateUser,
  validateIdParam,
  validateCreateStudent,
  validateCreateParentOnly,
} from "../../middlewares/validateUser.js";

/* ============================================================================
    PROTECTION
============================================================================ */
router.use(protect);

/* ============================================================================
    1. LIST & BULK OPERATIONS (NON-DYNAMIC FIRST)
============================================================================ */

// GET ALL USERS (List/Search) - /api/admin/users/list
router.get("/list", authorize("ADMIN", "SUPER_ADMIN"), userController.getUsers);

// BULK DELETE USERS - /api/admin/users/bulk-delete
router.post(
  "/bulk-delete",
  authorize("ADMIN", "SUPER_ADMIN"),
  userController.bulkDelete
);

/* ============================================================================
    2. STUDENT PROFILE MANAGEMENT (/api/admin/users/students)
    * ALL student routes must come before the generic /:id route *
============================================================================ */

// GET ALL STUDENTS (List/Search) - /api/admin/users/students (LIST ROUTE)
router.get(
  "/students",
  authorize("ADMIN", "SUPER_ADMIN"),
  studentController.getStudents
);

// CREATE STUDENT (User + StudentProfile)
router.post(
  "/students",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateCreateStudent,
  studentController.createStudent
);

// GET ONE STUDENT PROFILE - /api/admin/users/students/:id
router.get(
  "/students/:id",
  authorize("ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT"),
  validateIdParam,
  studentController.getStudentProfile
);

// UPDATE STUDENT PROFILE
router.put(
  "/students/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateIdParam,
  // validateUpdateStudent,
  studentController.updateStudentProfile
);

/* ============================================================================
    3. PARENT PROFILE MANAGEMENT (/api/admin/users/parents)
    * ALL parent routes must come before the generic /:id route *
============================================================================ */

// GET ALL PARENTS (List/Search) - /api/admin/users/parents (LIST ROUTE)
router.get(
  "/parents",
  authorize("ADMIN", "SUPER_ADMIN"),
  parentController.getParents
);

// CREATE PARENT (Standalone Parent)
router.post(
  "/parents",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateCreateParentOnly,
  parentController.createParent
);

// GET ONE PARENT PROFILE - /api/admin/users/parents/:id
router.get(
  "/parents/:id",
  authorize("ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT"),
  validateIdParam,
  parentController.getParentProfile
);

/* ============================================================================
    4. EMPLOYEE MANAGEMENT (/api/admin/users/employees)
    * ALL employee routes must come before the generic /:id route *
============================================================================ */

// GET ALL EMPLOYEES (List/Search) - /api/admin/users/employees (LIST ROUTE)
router.get(
  "/employees",
  authorize("ADMIN", "SUPER_ADMIN"),
  employeeController.getEmployees
);

// CREATE EMPLOYEE (Admin/Teacher) - Explicit Endpoint
router.post(
  "/employees",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateCreateUser,
  employeeController.createUser
);

// GET ONE EMPLOYEE PROFILE - /api/admin/users/employees/:id
router.get(
  "/employees/:id",
  authorize("ADMIN", "SUPER_ADMIN", "TEACHER"),
  validateIdParam,
  employeeController.getEmployeeProfile
);

/* ============================================================================
    5. GENERIC USER CRUD (DYNAMIC LAST)
    * This generic dynamic route MUST be last to avoid intercepting /students, /parents, etc. *
============================================================================ */

// GET ONE USER - /api/admin/users/:id
router.get(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN", "TEACHER", "PARENT"),
  validateIdParam,
  userController.getUser
);

// UPDATE USER - /api/admin/users/:id
router.put(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateIdParam,
  validateUpdateUser,
  userController.updateUser
);

// DELETE SINGLE USER (Soft Delete + Cascade) - /api/admin/users/:id
router.delete(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validateIdParam,
  userController.softDeleteUser
);

// 🟢 NEW ROUTE: HARD DELETE PROFILE (Permanent Delete + Unlink) - /api/admin/users/hard-delete/:id
// Note: We use a specific route like '/hard-delete/:id' to distinguish it from the soft delete '/:id'
router.delete(
  "/hard-delete/:id",
  authorize("SUPER_ADMIN"), // Recommended: Restrict this permanent action to the highest role
  validateIdParam,
  userController.hardDeleteProfile
);

// Add this to Section 2 of userRoutes.js

// 🟢 NEW ROUTE: LINK STUDENT TO PARENT - /api/admin/users/students/link-parent
router.post(
  "/students/link-parent",
  authorize("ADMIN", "SUPER_ADMIN"),
  userController.linkParent // Assuming userController is imported as 'userController'
);
/* ============================================================================
    EXPORT ROUTER
============================================================================ */
export default router;
