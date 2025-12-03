// D:\school-management\backend\controllers\admin\userController.js

import mongoose from "mongoose";
import asyncHandler from "../../middlewares/asyncHandler.js";
import logger from "../../utils/logger.js";

/* SERVICES */
import * as userService from "../../services/admin/userService.js"; // Core User CRUD, Master Cascades, Bulk
// 🟢 IMPORT: Get linkParentToStudent from parent service for re-linking
import { linkParentToStudent } from "../../services/parent/parentService.js";

/* ============================================================================
    HELPERS (Retained)
============================================================================ */

const isValidId = (id) => mongoose.isValidObjectId(id);

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

const handleServiceError = (res, error) => {
  const status = error.statusCode || error.status || 500;

  if (status >= 500) {
    logger.error(`Server Error (User Controller): ${error.message}`, {
      stack: error.stack,
      data: error.errors,
    });
  }

  const finalStatus =
    error.statusCode === 422 || error.status === 422 ? 422 : status;

  return res.status(finalStatus).json({
    success: false,
    message: error.message,
    errors: error.errors || null,
  });
};

// ---

/* ============================================================================
    GET ALL USERS (Generic List)
============================================================================ */
export const getUsers = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  if (req.query.role) filters.role = req.query.role.toLowerCase();
  if (req.query.status) filters.status = req.query.status;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  try {
    const result = await userService.getAllUsers({
      ...filters,
      page,
      limit,
      search: req.query.search || "",
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    GET SINGLE USER
============================================================================ */
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) return badRequest(res, "Invalid user ID");

  try {
    const user = await userService.getUserById(id);

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    UPDATE USER (Generic User Model update)
============================================================================ */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) return badRequest(res, "Invalid user ID");

  try {
    const updated = await userService.updateUser(id, req.body);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    SOFT DELETE USER (Master Orchestration)
============================================================================ */
export const softDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) return badRequest(res, "Invalid user ID");

  if (String(req.userId) === String(id)) {
    return badRequest(res, "You cannot delete your own account");
  }

  try {
    // deleteUserCascade orchestrates the soft deletion of User + Profile
    await userService.deleteUserCascade(id, req.userId);

    return res.status(200).json({
      success: true,
      message: "User soft deleted successfully",
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    HARD DELETE PROFILE (New Master Orchestration for Permanent Deletion) 💀
============================================================================ */
/**
 * Permanently deletes a profile (like Parent) and cascades the necessary unlinking.
 * This is designed to be called when deleting the profile document ID, not the User ID.
 * Expects the profile ID in params and type in query/body.
 *
 * API Usage Example: DELETE /api/admin/hard-delete/65b6a7102e345c2253c6e94f?type=parent
 */
export const hardDeleteProfile = asyncHandler(async (req, res) => {
  const { id: profileId } = req.params;
  const profileType = req.query.type || req.body.type; // Get type from query or body

  if (!isValidId(profileId)) return badRequest(res, "Invalid profile ID");
  if (!profileType)
    return badRequest(res, "Profile type (e.g., 'parent') is required.");

  // Authorization Check: You might want to add a check here to ensure the requester
  // has higher permissions for hard deletion compared to soft deletion.

  try {
    // hardDeleteUserCascade delegates to hardDeleteParentCascade which performs the permanent delete and unlinking.
    await userService.hardDeleteUserCascade(profileId, profileType, req.userId);

    return res.status(200).json({
      success: true,
      message: `Profile (${profileType}) permanently deleted and student links broken successfully.`,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    PARENT LINKING (Needed to re-link student to a new parent) 🔗
============================================================================ */
/**
 * Links a student profile to a new parent profile (after old parent was hard-deleted).
 * Expects studentId and parentId in the request body.
 * Route: POST /api/admin/users/students/link-parent
 */
export const linkParent = asyncHandler(async (req, res) => {
  const { studentId, parentId } = req.body; // Expect student and parent profile IDs

  if (!isValidId(studentId) || !isValidId(parentId)) {
    return badRequest(res, "Invalid Student ID or Parent ID for linking.");
  }

  try {
    await linkParentToStudent(studentId, parentId);

    return res.status(200).json({
      success: true,
      message: `Student (${studentId}) successfully linked to new Parent (${parentId}).`,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    BULK DELETE USERS (Master Orchestration)
============================================================================ */
export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return badRequest(res, "Provide an array of user IDs");
  }

  const invalidIds = ids.filter((id) => !isValidId(id));
  if (invalidIds.length > 0) {
    return badRequest(res, `Invalid user IDs: ${invalidIds.join(", ")}`);
  }

  if (ids.includes(String(req.userId))) {
    return badRequest(res, "You cannot delete your own account");
  }

  try {
    const result = await userService.bulkDeleteCascade(ids, req.userId);

    return res.status(200).json({
      success: true,
      message: "Bulk delete completed",
      total: result.total,
      deleted: result.deleted,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    EXPORT ALIASES (These exports belong in their dedicated controllers)
============================================================================ */
// (Exports remain commented out as they should be moved to dedicated Student/Parent/Employee controllers)
/*
export {
  createEmployeeAccount as createUser,
  createStudentAccount as createStudent,
  createParentAccount as createParent,
};
*/
