// D:\school-management\backend\controllers\student\studentController.js

import mongoose from "mongoose";
import asyncHandler from "../../middlewares/asyncHandler.js";
import * as studentService from "../../services/student/studentService.js";
import * as userService from "../../services/admin/userService.js"; // For transactional logic
import * as parentService from "../../services/parent/parentService.js"; // For parent creation
import { sendResponse, throwError } from "../../utils/response.js"; // Assuming sendResponse is a utility wrapper

/* ============================================================================
    HELPERS (Combined for clarity)
============================================================================ */

const isValidId = (id) => mongoose.isValidObjectId(id);

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

const handleServiceError = (res, error) => {
  const status = error.statusCode || error.status || 500;

  if (status >= 500) {
    console.error(
      `❌ Server Error (Student Controller): ${error.message}`,
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
    ADMIN SCOPE: CREATE STUDENT + PARENT
    POST /api/admin/users/students
============================================================================ */
export const createStudentAccount = asyncHandler(async (req, res) => {
  try {
    // Calling the transactional service which was previously in userService (now assumed to be here or imported)
    // Assuming userService holds the transactional function as per your original file structure
    const result = await studentService.createStudentAndParent(req.body);

    return res.status(201).json({
      success: true,
      message: "Student and parent created successfully",
      data: {
        student: {
          user: result.user,
          profile: result.profile,
          admissionNumber: result.admissionNumber,
        },
        parent: {
          profile: result.parent,
        },
      },
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    ADMIN SCOPE: READ/LIST STUDENTS
============================================================================ */
export const getStudents = asyncHandler(async (req, res) => {
  // Placeholder implementation using the dedicated service (listStudents)
  try {
    const result = await studentService.listStudents(req.query); // Assuming this service exists

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully.",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

/* ============================================================================
    ADMIN SCOPE: GET STUDENT PROFILE (Single)
============================================================================ */
export const getStudentProfileAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params; // Student Profile ID
  if (!isValidId(id)) return badRequest(res, "Invalid student profile ID");

  try {
    const profile = await studentService.getStudentProfileById(id); // Assuming dedicated service for Admin read

    return res.status(200).json({
      success: true,
      message: "Student profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

/* ============================================================================
    ADMIN SCOPE: UPDATE STUDENT PROFILE (Includes Parent Linkage)
============================================================================ */
export const updateStudentProfileAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params; // Student Profile ID

  if (!isValidId(id)) return badRequest(res, "Invalid student profile ID");

  try {
    // Still relying on userService to hold the complex transactional logic for now
    const updated = await studentService.updateStudentProfileAndParentLink(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully (Parent link handled)",
      data: updated,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    SELF-SERVICE: GET LOGGED-IN STUDENT PROFILE
    GET /api/student/profile
============================================================================ */
// Renamed to avoid collision with Admin function (if using same name in routes)
export const getStudentProfileSelf = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const profile = await studentService.getStudentProfileByUserId(userId);

    return sendResponse(res, 200, {
      message: "Student profile retrieved successfully.",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================================
    SELF-SERVICE: UPDATE STUDENT CONTACT / ADDRESS
    PATCH /api/student/profile
============================================================================ */
export const updateStudentContact = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const allowedFields = [
      "address",
      "city",
      "state",
      "pincode",
      "bloodGroup",
      "medicalNotes",
      "previousSchool",
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

    const updatedProfile = await studentService.updateStudentProfile(
      userId,
      updates
    );

    return sendResponse(res, 200, {
      message: "Student contact details updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// ---

/* ============================================================================
    EXPORT ALIASES (For clear route mapping from Admin controller)
============================================================================ */
export {
  createStudentAccount as createStudent,
  getStudentProfileAdmin as getStudentProfile, // Use the Admin scope function for the legacy name
  updateStudentProfileAdmin as updateStudentProfile,
};
