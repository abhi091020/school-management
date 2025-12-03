// backend/services/admin/userService.js

import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

/* MODELS */
import User from "../../models/admin/User.js";
import RecycleHistory from "../../models/admin/RecycleHistory.js";

/* UTILS */
import { throwError } from "../../utils/response.js";
import generateUserId from "../../utils/generateUserId.js";
import { hashPassword } from "../../utils/passwordUtils.js";

// --- IMPORT CASCADING SERVICES (The core of the refactor) ---
import {
  softDeleteStudentCascade,
  restoreStudentCascade,
} from "../student/studentService.js";
import {
  softDeleteParentCascade,
  restoreParentCascade,
  hardDeleteParentCascade, // 🟢 IMPORTED: The new permanent delete function
} from "../parent/parentService.js";
import {
  softDeleteEmployeeCascade,
  restoreEmployeeCascade,
} from "../employee/employeeService.js";

const DEFAULT_USER_PASSWORD = (
  process.env.DEFAULT_USER_PASSWORD || "School@2025"
).trim();

/* ============================================================================
  EXPORTED HELPERS (Low-Level Persistence Utilities)
  These are kept here as they operate generically across all Mongoose models
  and are needed by all dedicated services for transactional integrity.
============================================================================ */

/**
 * Performs a soft delete operation on a document.
 */
export const softDelete = async (Model, id, session, extra = {}) =>
  Model.updateOne(
    { _id: id },
    { isDeleted: true, deletedAt: new Date(), ...extra },
    { session }
  );

/**
 * Robustly restores a soft-deleted document using its snapshot.
 */
export const restoreDocumentFromSnapshot = async (
  Model,
  id,
  snapshot,
  session
) => {
  // Destructure the snapshot to exclude internal Mongoose fields
  const { _id, __v, createdAt, updatedAt, deletedAt, ...clean } = snapshot;

  return Model.updateOne(
    { _id: id }, // Match the existing document by its ID
    {
      ...clean,
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date(),
    },
    {
      runValidators: false,
      session,
      includeDeleted: true, // CRITICAL FIX: Allows update on soft-deleted docs
    }
  );
};

/* ============================================================================
  CORE USER FUNCTIONS (Create, Get, Update - Remain here)
============================================================================ */

/**
 * Creates a generic User account. Used internally by all profile services.
 */
export const createUser = async (userData, session = null) => {
  const password = await hashPassword(
    userData.password || DEFAULT_USER_PASSWORD,
    { skipValidation: true }
  );

  const role = String(userData.role).toLowerCase();
  const userId = await generateUserId(role);

  try {
    const [created] = await User.create(
      [
        {
          ...userData,
          role,
          userId,
          password,
          isFirstLogin: true,
          isDeleted: false,
          deletedAt: null,
          status: "active",
        },
      ],
      { session }
    );

    const obj = created.toObject();
    delete obj.password;
    return obj;
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      throwError(`Duplicate ${field}: '${err.keyValue[field]}'`, 409);
    }
    // Throw error here for transaction handling in parent functions
    throw err;
  }
};

export const getAllUsers = async ({
  page = 1,
  limit = 20,
  search = "",
  role,
  status,
  sortBy = "createdAt",
  sortOrder = -1,
  includeDeleted = false,
}) => {
  const query = {};
  if (!includeDeleted) query.isDeleted = false;
  if (role) query.role = role.toLowerCase();
  if (status) query.status = status;

  if (search.trim()) {
    const r = new RegExp(search.trim(), "i");
    query.$or = [{ name: r }, { email: r }, { phone: r }, { userId: r }];
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id) => {
  if (!mongoose.isValidObjectId(id)) throwError("Invalid user ID", 400);

  const user = await User.findOne({ _id: id, isDeleted: false })
    .select("-password")
    .lean();

  if (!user) throwError("User not found", 404);
  return user;
};

export const updateUser = async (id, payload) => {
  if (!mongoose.isValidObjectId(id)) throwError("Invalid user ID", 400);

  if (payload.password) {
    payload.password = await hashPassword(payload.password, {
      skipValidation: true,
    });
  }

  const updated = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: payload },
    { new: true }
  )
    .select("-password")
    .lean();

  if (!updated) throwError("User not found", 404);
  return updated;
};

/* ============================================================================
  MASTER CASCADE OPERATIONS (The Orchestrator)
============================================================================ */

/**
 * Orchestrates the cascading SOFT DELETE based on user role.
 * DELEGATES to the specific profile service.
 */
export const deleteUserCascade = async (userId, performedById) => {
  if (!mongoose.isValidObjectId(userId)) throwError("Invalid user ID", 400);

  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throwError("User not found", 404);

  const role = user.role.toLowerCase();

  // Call the appropriate soft delete cascade function based on role
  switch (role) {
    case "student":
      return softDeleteStudentCascade(userId, performedById);
    case "parent":
      return softDeleteParentCascade(userId, performedById);
    case "teacher":
    case "admin":
      return softDeleteEmployeeCascade(userId, performedById);
    default:
      // Handle generic roles that might not have a profile (e.g., system user)
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await softDelete(User, userId, session, { status: "inactive" });
        await session.commitTransaction();
        return {
          success: true,
          message: `Generic user (${role}) soft deleted.`,
        };
      } catch (err) {
        await session.abortTransaction();
        throwError(err.message || "Generic user delete failed", 500);
      } finally {
        session.endSession();
      }
  }
};

/**
 * Orchestrates the cascading HARD DELETE based on user role.
 * ⚠️ WARNING: This is a permanent operation.
 */
export const hardDeleteUserCascade = async (
  profileId,
  profileType,
  performedById
) => {
  if (!mongoose.isValidObjectId(profileId))
    throwError("Invalid profile ID", 400);

  const type = String(profileType).toLowerCase();

  // Only Parent hard delete is supported for now, as it's the only one that
  // requires breaking a link (to a student). Other hard deletes can be done
  // directly if needed, but we delegate here.
  switch (type) {
    case "parent":
      return hardDeleteParentCascade(profileId, performedById);

    // Add other hard delete cascades (student, employee) here if needed later
    // case "student":
    //     return hardDeleteStudentCascade(profileId, performedById);

    default:
      throwError(
        `Hard delete cascade is not supported for profile type: ${profileType}`,
        400
      );
  }
};

/**
 * Orchestrates the cascading RESTORE based on the deleted profile type ID found
 * in the RecycleHistory log. DELEGATES to the specific profile service.
 */
export const restoreUserCascade = async (profileId, performedById) => {
  const idStr = String(profileId);
  if (!mongoose.isValidObjectId(idStr)) throwError("Invalid profile ID", 400);

  // We must find the type from the RecycleHistory first to know which service to call
  const deleteLog = await RecycleHistory.findOne({
    itemId: idStr,
    action: "deleted",
    type: { $in: ["student", "parent", "teacher", "admin"] },
    isActive: true,
  })
    .sort({ timestamp: -1 })
    .lean();

  if (!deleteLog)
    throwError("Restore history log not found for this profile", 404);

  const profileType = deleteLog.type;

  // Call the appropriate cascade function based on role/type
  switch (profileType) {
    case "student":
      return restoreStudentCascade(profileId, performedById);
    case "parent":
      return restoreParentCascade(profileId, performedById);
    case "teacher":
    case "admin":
      return restoreEmployeeCascade(profileId, performedById);
    default:
      throwError(`Unknown profile type for restore: ${profileType}`, 500);
  }
};

/* ============================================================================
  BULK DELETE (Remains here, calls the soft delete orchestrator)
============================================================================ */
export const bulkDeleteCascade = async (ids, performedById) => {
  if (!Array.isArray(ids) || ids.length === 0)
    throwError("Invalid bulk delete payload", 400);

  if (ids.includes(String(performedById)))
    throwError("You cannot delete your own account");

  const result = [];

  for (const id of ids) {
    if (!mongoose.isValidObjectId(id))
      throwError(`Invalid user ID: ${id}`, 400);

    try {
      // Note: deleteUserCascade handles its own transaction
      await deleteUserCascade(id, performedById);
      result.push({ id, success: true });
    } catch (err) {
      result.push({ id, success: false, error: err.message });
    }
  }

  return {
    success: true,
    total: ids.length,
    deleted: result.filter((r) => r.success).length,
    failed: result.filter((r) => !r.success).length,
    results: result,
  };
};
