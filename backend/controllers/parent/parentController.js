// D:\school-management\backend\controllers\parent\parentController.js

import mongoose from "mongoose";
import asyncHandler from "../../middlewares/asyncHandler.js";
import * as userService from "../../services/admin/userService.js"; // For transactional logic
import {
  getParentProfileByUserId,
  updateParentProfile as serviceUpdateParentProfile,
  listParents as serviceListParents,
  getParentProfileById as serviceGetParentProfileById,
  createParentOnlyAndUser as serviceCreateParentOnlyAndUser,
} from "../../services/parent/parentService.js";

import { sendResponse, throwError } from "../../utils/response.js";

/* ============================================================================
    HELPERS
============================================================================ */

const isValidId = (id) => mongoose.isValidObjectId(id);

const badRequest = (res, message) =>
  sendResponse(res, 400, { success: false, message });

const toTitleCase = (str) =>
  String(str)
    .trim()
    .split(/\s+/)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const PHONE_REGEX = /^\d{10}$/;
const PINCODE_REGEX = /^\d{6}$/;

const handleServiceError = (res, error) => {
  const status = error.statusCode || error.status || 500;

  if (status >= 500) {
    console.error(
      `❌ Server Error (Parent Controller): ${error.message}`,
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
    ADMIN SCOPE: CREATE STANDALONE PARENT ACCOUNT
    POST /api/admin/users/parents
============================================================================ */
export const createParentAccount = asyncHandler(async (req, res) => {
  const payload = req.body;

  if (!payload.user || !payload.parent) {
    return badRequest(res, "Missing 'user' or 'parent' fields in the payload.");
  }

  const role = String(payload.user.role).toLowerCase();

  if (role !== "parent") {
    return badRequest(res, "Invalid role provided. Must be 'parent'.");
  }

  try {
    // Assuming the transactional function is in parentService
    const result = await serviceCreateParentOnlyAndUser(payload);

    return sendResponse(res, 201, {
      message: "Standalone Parent account created successfully.",
      data: {
        user: result.user,
        profile: result.profile,
      },
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

/* ============================================================================
    ADMIN SCOPE: GET PARENTS (List)
============================================================================ */
export const getParents = asyncHandler(async (req, res) => {
  try {
    // Placeholder implementation using the dedicated service (listParents)
    const result = await serviceListParents(req.query);

    return sendResponse(res, 200, {
      message: "Parents fetched successfully.",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

/* ============================================================================
    ADMIN SCOPE: GET PARENT PROFILE (Single)
============================================================================ */
export const getParentProfileAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return badRequest(res, "Invalid parent profile ID");

  try {
    const profile = await serviceGetParentProfileById(id);
    if (!profile) throwError("Parent profile not found.", 404);

    return sendResponse(res, 200, {
      message: "Parent profile retrieved successfully.",
      profile,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

// ---

/* ============================================================================
    SELF-SERVICE: GET LOGGED-IN PARENT PROFILE
    GET /api/parent/profile
============================================================================ */
export const getParentProfileSelf = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const profile = await getParentProfileByUserId(userId);
    if (!profile) throwError("Parent profile not found.", 404);

    return sendResponse(res, 200, {
      message: "Parent profile retrieved successfully.",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================================
    SELF-SERVICE: UPDATE PARENT PROFILE (Self-update)
    PATCH /api/parent/profile
============================================================================ */
export const updateParentProfileSelf = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const ALLOWED_FIELDS = new Set([
      "fatherName",
      "fatherPhone",
      "motherName",
      "motherPhone",
      "occupation",
      "annualIncome",
      "familyStatus",
      "address",
      "city",
      "state",
      "pincode",
      "emergencyContactPhone",
    ]);

    const payload = {};

    for (const key in req.body) {
      if (!ALLOWED_FIELDS.has(key)) continue;

      let value = req.body[key];

      if (["fatherName", "motherName", "city", "state"].includes(key)) {
        value = toTitleCase(value);
      }

      payload[key] = value;
    }

    // Validations
    const validatePhone = (field, name) => {
      if (payload[field] && !PHONE_REGEX.test(payload[field])) {
        throwError(`${name} must be a valid 10-digit number.`, 422);
      }
    };
    validatePhone("fatherPhone", "Father phone");
    validatePhone("motherPhone", "Mother phone");
    validatePhone("emergencyContactPhone", "Emergency contact phone");

    if (payload.pincode && !PINCODE_REGEX.test(payload.pincode)) {
      throwError("Pincode must be 6 digits.", 422);
    }

    if (
      payload.annualIncome !== undefined &&
      (typeof payload.annualIncome !== "number" ||
        payload.annualIncome < 0 ||
        isNaN(payload.annualIncome))
    ) {
      throwError("annualIncome must be a valid non-negative number.", 422);
    }

    const updatedProfile = await serviceUpdateParentProfile(userId, payload);

    return sendResponse(res, 200, {
      message: "Parent profile updated successfully.",
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
  createParentAccount as createParent,
  getParentProfileAdmin as getParentProfile,
  updateParentProfileSelf as updateParentProfile, // Alias the self-update function for the /api/parent/profile route
};
