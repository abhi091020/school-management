// backend/services/employee/employeeService.js

import mongoose from "mongoose";

/* MODELS */
import EmployeeProfile from "../../models/admin/EmployeeProfile.js";
import User from "../../models/admin/User.js";
import RecycleHistory from "../../models/admin/RecycleHistory.js";

/* UTILS */
import { throwError } from "../../utils/response.js";
import { logRecycleEvent } from "../../utils/recycleLogger.js";
import { normalizeSnapshot } from "../../utils/recycleUtils.js";
import { hashPassword } from "../../utils/passwordUtils.js"; // <-- REQUIRED IMPORT for updateEmployeeProfileAndUser

// --- IMPORT NECESSARY FUNCTIONS FROM OTHER SERVICES (or central utilities) ---
import {
  createUser, // Generic User creation (remains in userService.js)
  softDelete, // Generic soft delete helper (remains in userService.js)
  restoreDocumentFromSnapshot, // Generic restore helper (remains in userService.js)
} from "../admin/userService.js";

const DEFAULT_USER_PASSWORD = (
  process.env.DEFAULT_USER_PASSWORD || "School@2025"
).trim();

/* ============================================================
   HELPER: Normalize Payload
============================================================ */
// This helper prepares the data for saving/updating the profile document
const normalizeEmployeeProfilePayload = (payload) => ({
  // Employment Details
  employeeId: payload.employeeId,
  designation: payload.designation,
  joiningDate: payload.joiningDate,
  department: payload.department,
  subjectSpecialization: payload.subjectSpecialization,
  isFullTime: payload.isFullTime,
  salaryGrade: payload.salaryGrade,
  // Admin Specific
  canManageUsers: payload.canManageUsers,
  isSuperAdmin: payload.isSuperAdmin,
  // Personal Details
  name: payload.name,
  dob: payload.dob,
  gender: payload.gender,
  personalPhone: payload.personalPhone,
  personalEmail: payload.personalEmail,
  qualification: payload.qualification,
  // Address & Emergency Contact
  addressLine1: payload.addressLine1,
  city: payload.city,
  state: payload.state,
  pincode: payload.pincode,
  emergencyContactName: payload.emergencyContactName,
  emergencyContactPhone: payload.emergencyContactPhone,
});

/* ============================================================================
   1. CREATE EMPLOYEE AND USER (Transactional)
============================================================================ */
export const createEmployeeAndUser = async (payload) => {
  if (!payload?.user || !payload?.profile)
    throwError(
      "Missing required 'user' and 'profile' fields in the payload.",
      400
    );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const role = String(payload.user.role).toLowerCase();
    if (role !== "teacher" && role !== "admin") {
      throwError(
        "User role must be 'teacher' or 'admin' for employee creation.",
        400
      );
    }

    // 1. Create the User (Handles password hashing, role, and userId generation)
    const employeeUser = await createUser(
      {
        name: payload.user.name,
        email: payload.user.email,
        phone: payload.user.phone,
        role: role,
      },
      session
    );

    // 2. Create the Employee Profile using the new user's ID
    const employeeProfileData = {
      ...payload.profile,
      userId: employeeUser.userId, // Link the profile using the generated string userId
    };

    const employeeProfile = await createEmployeeProfile(
      employeeProfileData,
      session
    );

    await session.commitTransaction();

    return {
      user: employeeUser,
      profile: employeeProfile,
    };
  } catch (err) {
    await session.abortTransaction();

    if (err.code === 11000) {
      throwError(
        "Creation failed due to a duplicate field (Email, Phone, or Employee ID).",
        409
      );
    }

    throwError(err.message || "Employee creation failed.", 500);
  } finally {
    session.endSession();
  }
};

/* ============================================================================
   2. CREATE EMPLOYEE PROFILE (Called by createEmployeeAndUser only)
============================================================================ */
export const createEmployeeProfile = async (profileData, session) => {
  if (!profileData.userId || typeof profileData.userId !== "string") {
    throwError("Invalid or missing userId.", 400);
  }

  const mapped = {
    ...normalizeEmployeeProfilePayload(profileData),
    userId: profileData.userId,
  };

  try {
    const [newProfile] = await EmployeeProfile.create([mapped], { session });
    return newProfile;
  } catch (error) {
    console.error("❌ Employee Profile Creation Error:", error);

    if (error.code === 11000) {
      if (error.keyPattern.employeeId) {
        throwError("Employee ID must be unique.", 409);
      }
      if (error.keyPattern.userId) {
        throwError("A profile already exists for this user.", 409);
      }
    }
    if (error instanceof mongoose.Error.ValidationError) {
      throwError("Profile validation failed.", 422, error.errors);
    }

    throw error;
  }
};

/* ============================================================================
    READ OPERATIONS 📚
============================================================================ */

/**
 * 5. GET EMPLOYEE PROFILE BY USER ID (For self-access)
 */
export const getEmployeeProfileByUserId = async (userId) => {
  const profile = await EmployeeProfile.findOne({
    userId: userId,
    isDeleted: false,
  }).lean();

  if (!profile) throwError("Employee profile not found.", 404);
  return profile;
};

/**
 * 7. GET EMPLOYEE PROFILE BY ID (For Admin access)
 * REQUIRED: Used by admin routes.
 */
export const getEmployeeProfileById = async (profileId) => {
  if (!mongoose.isValidObjectId(profileId)) {
    throwError("Invalid employee profile ID", 400);
  }

  const profile = await EmployeeProfile.findById(profileId).lean();

  if (!profile) throwError("Employee profile not found.", 404);
  return profile;
};

/* ============================================================================
    UPDATE OPERATIONS 🔄
============================================================================ */

/**
 * 6. UPDATE EMPLOYEE PROFILE (Self-update: Contact/Address)
 * Restricts updates to non-sensitive fields.
 */
export const updateEmployeeProfileDetails = async (userId, updates) => {
  // Prevent updating critical fields through a self-service route
  delete updates.userId;
  delete updates.employeeId;
  delete updates.designation;
  delete updates.isSuperAdmin;
  delete updates.canManageUsers;

  const updated = await EmployeeProfile.findOneAndUpdate(
    { userId: userId, isDeleted: false },
    updates,
    {
      new: true,
      runValidators: true,
      lean: true,
    }
  );

  if (!updated)
    throwError("Employee profile not found or already deleted.", 404);
  return updated;
};

/**
 * 8. UPDATE EMPLOYEE PROFILE AND USER (Transactional - Admin Update)
 * REQUIRED: Used by Admin to update sensitive fields and User accounts.
 */
export const updateEmployeeProfileAndUser = async (profileId, payload) => {
  if (!mongoose.isValidObjectId(profileId))
    throwError("Invalid employee profile ID", 400);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user: userUpdates = {}, ...profileUpdates } = payload;
    let updatedProfile = null;
    let updatedUser = null;

    // 1. Find the current profile to get the linked userId
    const employeeProfile = await EmployeeProfile.findById(profileId)
      .select("userId isDeleted")
      .session(session);

    if (!employeeProfile || employeeProfile.isDeleted) {
      throwError("Employee profile not found or is deleted", 404);
    }

    // 2. Update the Employee User Account
    if (Object.keys(userUpdates).length > 0) {
      if (userUpdates.password) {
        // Hash the new password before saving
        userUpdates.password = await hashPassword(userUpdates.password, {
          skipValidation: true,
        });
      }

      updatedUser = await User.findOneAndUpdate(
        { userId: employeeProfile.userId, isDeleted: false },
        { $set: userUpdates },
        { new: true, select: "-password", session }
      ).lean();

      if (!updatedUser) {
        throwError("Linked user account not found or is deleted.", 404);
      }
    }

    // 3. Update the Employee Profile
    if (Object.keys(profileUpdates).length > 0) {
      updatedProfile = await EmployeeProfile.findOneAndUpdate(
        { _id: profileId, isDeleted: false },
        { $set: profileUpdates },
        { new: true, runValidators: true, session }
      ).lean();

      if (!updatedProfile) {
        throwError("Failed to update employee profile.", 500);
      }
    }

    await session.commitTransaction();

    return {
      profile: updatedProfile,
      user: updatedUser,
    };
  } catch (err) {
    await session.abortTransaction();
    if (err.name === "ValidationError") {
      throwError(err.message, 422, err.errors);
    }
    // Check for duplicate error thrown from database operations
    if (err.code === 11000) {
      throwError(
        "Update failed due to a duplicate field (Email, Phone, or Employee ID).",
        409
      );
    }
    throw err;
  } finally {
    session.endSession();
  }
};

/* ============================================================================
   3. SOFT DELETE EMPLOYEE/ADMIN PROFILE (Cascade) 🗑️
============================================================================ */
export const softDeleteEmployeeCascade = async (
  userToDeleteId,
  performedById
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const actor = await User.findById(performedById)
      .select("_id name email role")
      .lean();
    if (!actor) throwError("Actor not found", 404);

    const user = await User.findOne({
      _id: userToDeleteId,
      isDeleted: false,
    }).session(session);
    const role = user?.role?.toLowerCase();

    if (!user || (role !== "teacher" && role !== "admin"))
      throwError("Employee/Admin user not found", 404);

    const userIdString = user.userId;

    // 1. Find the Employee Profile
    const employee = await EmployeeProfile.findOne({
      userId: userIdString,
    }).session(session);

    if (employee) {
      // 2. Prepare Snapshot for Recycle History
      const employeeObj = employee.toObject();
      employeeObj.email = user.email;
      employeeObj.userRole = role; // Add role to snapshot for better context

      const snap = await normalizeSnapshot(employeeObj);

      // 3. Soft Delete Profile
      await softDelete(EmployeeProfile, employee._id, session); // Assumes softDelete is imported

      // 4. Log profile deletion (using the actual role for the type field)
      await logRecycleEvent({
        session,
        itemId: String(employee._id),
        type: role, // Use 'teacher' or 'admin' as the type
        action: "deleted",
        snapshot: snap,
        performedBy: actor,
      });
    }

    // 5. Soft Delete the linked User account
    await softDelete(User, user._id, session, { status: "inactive" });

    await session.commitTransaction();
    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    throwError(err.message || "Employee/Admin deletion failed", 500);
  } finally {
    session.endSession();
  }
};

/* ============================================================================
   4. RESTORE EMPLOYEE/ADMIN PROFILE (Cascade) ♻️
============================================================================ */
export const restoreEmployeeCascade = async (profileId, performedById) => {
  const idStr = String(profileId);
  if (!mongoose.isValidObjectId(idStr)) throwError("Invalid ID", 400);

  const profileObjId = new mongoose.Types.ObjectId(idStr);
  const session = await mongoose.startSession({ strict: true });
  session.startTransaction();

  try {
    const actor = await User.findById(performedById)
      .select("_id name email role")
      .lean();
    if (!actor) throwError("Actor not found", 404);

    // 1. Find the deletion log for this profile
    const deleteLog = await RecycleHistory.findOne(
      {
        itemId: idStr,
        action: "deleted",
        type: { $in: ["teacher", "admin"] },
        isActive: true,
      },
      null,
      { session }
    )
      .sort({ timestamp: -1 })
      .lean();

    if (!deleteLog)
      throwError("Employee/Admin restore history log not found", 404);

    let profileSnap = deleteLog.snapshot || {};
    let safeUserId = profileSnap.userId;
    const profileType = deleteLog.type;

    // 2. FALLBACK: Check DB if userId is missing from snapshot (as in original logic)
    if (!safeUserId) {
      const profileDoc = await EmployeeProfile.findById(idStr)
        .setOptions({ includeDeleted: true })
        .select("userId")
        .session(session)
        .lean();

      if (!profileDoc || !profileDoc.userId)
        throwError(
          `Cannot restore. Linked profile or userId not found in DB.`,
          404
        );

      safeUserId = profileDoc.userId;

      if (Object.keys(profileSnap).length === 0) {
        profileSnap =
          (await EmployeeProfile.findById(idStr)
            .setOptions({ includeDeleted: true })
            .session(session)
            .lean()) || profileSnap;
      }
    }

    if (!safeUserId)
      throwError(
        "Critical: Could not determine linked user ID for restore.",
        500
      );

    // 3. Restore Employee Profile
    await restoreDocumentFromSnapshot(
      EmployeeProfile,
      profileObjId,
      profileSnap,
      session
    );

    // 4. Restore linked User account
    const userDoc = await User.findOne(
      { userId: safeUserId, isDeleted: true },
      null,
      { session }
    ).setOptions({ includeDeleted: true });

    if (!userDoc)
      throwError(
        `Cannot restore. Linked user account (ID: ${safeUserId}) not found or already active.`,
        404
      );

    // Restore the linked User document
    await User.updateOne(
      { _id: userDoc._id },
      { $set: { isDeleted: false, deletedAt: null, status: "active" } },
      { session, includeDeleted: true }
    );

    // 5. Log restore event
    await logRecycleEvent({
      session,
      itemId: idStr,
      type: profileType,
      action: "restored",
      snapshot: profileSnap,
      performedBy: actor,
    });

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
