// D:\school-management\backend\controllers\employee\employeeController.js

import mongoose from "mongoose";
import asyncHandler from "../../middlewares/asyncHandler.js";
import * as employeeService from "../../services/employee/employeeService.js";
import * as userService from "../../services/admin/userService.js"; // For transactional logic
import { sendResponse, throwError } from "../../utils/response.js";

/* ============================================================================
    HELPERS (Combined for clarity)
============================================================================ */

const isValidId = (id) => mongoose.isValidObjectId(id);

const badRequest = (res, message) =>
  sendResponse(res, 400, { success: false, message });

const handleServiceError = (res, error) => {
  const status = error.statusCode || error.status || 500;

  if (status >= 500) {
    console.error(
      `❌ Server Error (Employee Controller): ${error.message}`,
      error
    );
  }

  const finalStatus =
    error.statusCode === 422 || error.status === 422 ? 422 : status;

  return sendResponse(res, finalStatus, {
    success: false,
    message: error.message,
    errors: error.errors || null,
  });
};

// ---

/* ============================================================================
    ADMIN SCOPE: CREATE EMPLOYEE (ADMIN / TEACHER)
    POST /api/admin/users/employees
============================================================================ */
export const createEmployeeAccount = asyncHandler(async (req, res) => {
  const payload = req.body;

  if (!payload.user || !payload.profile) {
    return badRequest(
      res,
      "Missing 'user' or 'profile' fields in the payload."
    );
  }

  const role = String(payload.user.role).toLowerCase();

  if (role !== "admin" && role !== "teacher") {
    return badRequest(
      res,
      "Invalid role provided for employee creation. Must be 'admin' or 'teacher'."
    );
  }

  try {
    // Still relying on userService to hold the complex transactional logic for now
    const result = await employeeService.createEmployeeAndUser(payload);

    return sendResponse(res, 201, {
      message: `Employee (${result.user.role}) account created successfully.`,
      data: {
        user: result.user,
        profile: result.profile,
      },
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    ADMIN SCOPE: GET EMPLOYEES (List)
============================================================================ */
export const getEmployees = asyncHandler(async (req, res) => {
  try {
    // Placeholder implementation using the dedicated service (listEmployees)
    const result = await employeeService.listEmployees(req.query); // Assuming this service exists

    return sendResponse(res, 200, {
      message: "Employees fetched successfully.",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

/* ============================================================================
    ADMIN SCOPE: GET EMPLOYEE PROFILE (Single)
============================================================================ */
export const getEmployeeProfileAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return badRequest(res, "Invalid employee profile ID");

  try {
    const profile = await employeeService.getEmployeeProfileById(id); // Assuming dedicated service for Admin read

    return sendResponse(res, 200, {
      message: `Employee profile fetched successfully.`,
      profile,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

/* ============================================================================
    SELF-SERVICE: GET LOGGED-IN EMPLOYEE PROFILE
    GET /api/employee/profile
============================================================================ */
export const getEmployeeProfileSelf = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await employeeService.getEmployeeProfileByUserId(userId);

    return sendResponse(res, 200, {
      message: "Employee profile retrieved successfully.",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================================
    SELF-SERVICE: UPDATE EMPLOYEE CONTACT / ADDRESS
    PATCH /api/employee/profile
============================================================================ */
export const updateEmployeeProfileDetails = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const allowedFields = [
      "personalPhone",
      "personalEmail",
      "addressLine1",
      "city",
      "state",
      "pincode",
      "emergencyContactName",
      "emergencyContactPhone",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return sendResponse(res, 400, {
        message: "No valid fields to update.",
      });
    }

    const updatedProfile = await employeeService.updateEmployeeProfileDetails(
      userId,
      updates
    );

    return sendResponse(res, 200, {
      message: "Employee details updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// ---

/* ============================================================================
    EXPORT ALIASES (For clear route mapping)
============================================================================ */
export {
  createEmployeeAccount as createUser,
  getEmployeeProfileAdmin as getEmployeeProfile, // Use Admin scope for the general lookup
};
