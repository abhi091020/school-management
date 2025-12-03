// backend/services/parent/parentService.js

import mongoose from "mongoose";

/* MODELS */
import User from "../../models/admin/User.js";
import Student from "../../models/admin/Student.js";
import Parent from "../../models/admin/Parent.js";
import RecycleHistory from "../../models/admin/RecycleHistory.js";

/* UTILS */
import { throwError } from "../../utils/response.js";
import { hashPassword } from "../../utils/passwordUtils.js";

// --- IMPORT NECESSARY FUNCTIONS FROM OTHER SERVICES (or central utilities) ---
import {
  createUser, // Generic User creation (remains in userService.js)
  softDelete, // Generic soft delete helper (remains in userService.js)
  restoreDocumentFromSnapshot, // Generic restore helper (remains in userService.js)
} from "../admin/userService.js";
import { logRecycleEvent } from "../../utils/recycleLogger.js";
import { normalizeSnapshot } from "../../utils/recycleUtils.js";

const DEFAULT_USER_PASSWORD = (
  process.env.DEFAULT_USER_PASSWORD || "School@2025"
).trim();

/* ============================================================================
  NORMALIZER — STRICT MAPPING (Kept as is)
============================================================================ */
const normalizeParentPayload = (payload) => ({
  userId: payload.userId, // Must be ObjectId, validated below

  fatherName: payload.fatherName || "",
  fatherPhone: payload.fatherPhone || "",

  motherName: payload.motherName || "",
  motherPhone: payload.motherPhone || "",

  occupation: payload.occupation || "",
  annualIncome: payload.annualIncome ?? null,
  familyStatus: payload.familyStatus || "",

  address: payload.address || "",
  city: payload.city || "",
  state: payload.state || "",
  pincode: payload.pincode || "",

  emergencyContactPhone: payload.emergencyContactPhone || "",
});

/* ============================================================================
  HELPER: Creates a new Parent User and Profile (FOR STUDENT/UPDATE USE)
============================================================================ */
export const createNewParentFromPayload = async (parentPayload, session) => {
  if (!parentPayload?.user || !parentPayload?.parent) {
    throwError(
      "Missing required 'user' or 'parent' fields for parent creation.",
      400
    );
  }

  // 1. Create the Parent User (Assumes createUser handles ID generation)
  const parentUser = await createUser(
    {
      name:
        parentPayload.user.name ||
        parentPayload.parent.fatherName ||
        parentPayload.parent.motherName,
      email: parentPayload.user.email,
      phone:
        parentPayload.user.phone ||
        parentPayload.parent.fatherPhone ||
        parentPayload.parent.motherPhone,
      role: "parent",
    },
    session
  );

  // 2. Create the Parent Profile
  const [parentProfile] = await Parent.create(
    [
      {
        userId: parentUser.userId,
        children: [], // Important: Initialize empty
        ...parentPayload.parent,
        isDeleted: false,
        deletedAt: null,
      },
    ],
    { session }
  );

  // Return the Profile ID of the newly created parent (used for linking)
  return parentProfile._id;
};

/* ============================================================================
  READ OPERATIONS 📚
============================================================================ */

/**
 * Retrieves the parent profile by the linked string userId.
 * This is used for self-access by parents.
 */
export const getParentProfileByUserId = async (userId) => {
  const profile = await Parent.findOne({
    userId: userId,
    isDeleted: false,
  })
    .populate({
      path: "children",
      select: "admissionNumber classId status name", // Include 'name' for useful self-service data
      match: { isDeleted: false }, // Only show active children
    })
    .lean();

  if (!profile) throwError("Parent profile not found.", 404);
  return profile;
};

/**
 * Retrieves a list of parent profiles, filtered and paginated. (Needed for Admin List)
 */
export const listParents = async ({
  page = 1,
  limit = 20,
  search = "",
  sortBy = "createdAt",
  sortOrder = -1,
  includeDeleted = false,
}) => {
  const query = {};

  // 1. Filter deleted status
  if (!includeDeleted) query.isDeleted = false;

  // 2. Handle search term (Only basic profile fields for speed, User search is handled by the admin user endpoint)
  if (search.trim()) {
    const r = new RegExp(search.trim(), "i");
    query.$or = [
      { fatherName: r },
      { motherName: r },
      { address: r },
      { city: r },
    ];
  }

  const parents = await Parent.find(query)
    .populate({
      path: "children",
      select: "admissionNumber classId status name",
      match: { isDeleted: false },
    })
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Parent.countDocuments(query);

  return {
    data: parents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Retrieves the parent profile by its MongoDB document _id.
 * This is typically used by Admin/User Management routes.
 */
export const getParentProfileById = async (profileId) => {
  if (!mongoose.isValidObjectId(profileId)) {
    throwError("Invalid parent profile ID", 400);
  }

  const profile = await Parent.findById(profileId)
    .populate({
      path: "children",
      select: "admissionNumber classId status",
      match: { isDeleted: false }, // Only show active children
    })
    .lean();

  if (!profile) throwError("Parent profile not found.", 404);
  return profile;
};

/* ============================================================================
  CREATE STANDALONE PARENT ACCOUNT (Transactional) ➕
============================================================================ */
export const createParentOnlyAndUser = async (payload) => {
  if (!payload?.user || !payload?.parent)
    throwError(
      "Missing required 'user' and 'parent' fields in the payload.",
      400
    );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const role = String(payload.user.role).toLowerCase();
    if (role !== "parent") {
      throwError(
        "User role must be 'parent' for standalone parent creation.",
        400
      );
    }

    // 1. Create the User (Handles password hashing, role, and userId generation)
    const parentUser = await createUser(
      {
        name:
          payload.user.name ||
          payload.parent.fatherName ||
          payload.parent.motherName,
        email: payload.user.email,
        phone:
          payload.user.phone ||
          payload.parent.fatherPhone ||
          payload.parent.motherPhone,
        role: "parent",
      },
      session
    );

    // 2. Create the Parent Profile
    const [parentProfile] = await Parent.create(
      [
        {
          userId: parentUser.userId, // Link the profile using the generated string userId
          children: [], // IMPORTANT: The children array is initialized empty
          ...payload.parent,
          isDeleted: false,
          deletedAt: null,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      user: parentUser,
      profile: parentProfile,
    };
  } catch (err) {
    await session.abortTransaction();

    if (err.code === 11000) {
      throwError(
        "Creation failed due to a duplicate field (Email, Phone).",
        409
      );
    }

    throw err;
  } finally {
    session.endSession();
  }
};

/* ============================================================================
  UPDATE PARENT ACCOUNT (Non-Transactional/Self-Service) 🔄
============================================================================ */

/**
 * Updates the Parent profile (only profile fields) based on the linked string userId.
 * This is used for self-service updates by the parent.
 */
export const updateParentProfile = async (userId, payload) => {
  // 1. Find the current profile by the string userId
  const updated = await Parent.findOneAndUpdate(
    { userId: userId, isDeleted: false },
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate({
      path: "children",
      select: "admissionNumber classId status name",
      match: { isDeleted: false },
    })
    .lean();

  if (!updated) throwError("Parent profile not found.", 404);
  return updated;
};

/* ============================================================================
  UPDATE PARENT ACCOUNT (Transactional/Admin Scope) 🔄
============================================================================ */

/**
 * Updates the Parent's User account and their profile simultaneously.
 */
export const updateParentProfileAndUser = async (profileId, payload) => {
  if (!mongoose.isValidObjectId(profileId))
    throwError("Invalid parent profile ID", 400);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the current profile to get the linked userId
    const parentProfile = await Parent.findById(profileId)
      .select("userId isDeleted")
      .session(session);

    if (!parentProfile || parentProfile.isDeleted) {
      throwError("Parent profile not found or is deleted", 404);
    }

    // 2. Prepare User and Profile updates
    const userUpdates = payload.user || {};
    const profileUpdates = { ...payload };
    delete profileUpdates.user; // Remove user object from profile payload

    let updatedUser = null;
    let updatedProfile = null;

    // A. Update the Parent User Account
    if (Object.keys(userUpdates).length > 0) {
      if (userUpdates.password) {
        userUpdates.password = await hashPassword(userUpdates.password, {
          skipValidation: true,
        });
      }

      // Find by userId (string) for robustness
      updatedUser = await User.findOneAndUpdate(
        { userId: parentProfile.userId, isDeleted: false },
        { $set: userUpdates },
        { new: true, select: "-password", session }
      ).lean();

      if (!updatedUser) {
        throwError("Linked user account not found or is deleted.", 404);
      }
    }

    // B. Update the Parent Profile
    if (Object.keys(profileUpdates).length > 0) {
      updatedProfile = await Parent.findOneAndUpdate(
        { _id: profileId, isDeleted: false },
        { $set: profileUpdates },
        { new: true, runValidators: true, session }
      )
        .populate({
          path: "children",
          select: "admissionNumber classId status",
          match: { isDeleted: false },
        })
        .lean();

      if (!updatedProfile) {
        // Should only happen if profile was somehow deleted concurrently
        throwError("Failed to update parent profile.", 500);
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
    throw err;
  } finally {
    session.endSession();
  }
};

/* ============================================================================
  SOFT DELETE PARENT PROFILE (Cascade) 🗑️
============================================================================ */
export const softDeleteParentCascade = async (
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
    if (!user || user.role.toLowerCase() !== "parent")
      throwError("Parent user not found", 404);

    const userIdString = user.userId;

    // 1. Find the Parent Profile
    const parent = await Parent.findOne({ userId: userIdString }).session(
      session
    );

    if (parent) {
      // 2. Prepare Snapshot for Recycle History
      const parentObj = parent.toObject();
      parentObj.email = user.email;

      // LOGIC TO CLEAN CHILDREN FOR SNAPSHOT (Only active children)
      if (parentObj.children && parentObj.children.length > 0) {
        const activeChildren = await Student.find(
          {
            _id: { $in: parentObj.children },
            isDeleted: false,
          },
          "userId", // Select 'userId' (Student's User ID)
          { session }
        ).lean();

        // Store the list of Student User IDs
        const studentUserIds = activeChildren.map((c) => c.userId);

        if (studentUserIds.length > 0) {
          parentObj.activeChildrenUserIds = studentUserIds; // ADDED: Active Student User IDs
        }

        // Update the children array in the object to only contain *active* children IDs.
        parentObj.children = activeChildren.map((c) => c._id);
      }

      const snap = await normalizeSnapshot(parentObj);

      // 3. Soft Delete Profile
      await softDelete(Parent, parent._id, session); // Assumes softDelete is imported

      // 4. Log ONLY parent profile deletion
      await logRecycleEvent({
        session,
        itemId: String(parent._id),
        type: "parent",
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
    throwError(err.message || "Parent deletion failed", 500);
  } finally {
    session.endSession();
  }
};

/* ============================================================================
  RESTORE PARENT PROFILE (Cascade) ♻️
============================================================================ */
export const restoreParentCascade = async (profileId, performedById) => {
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
        type: "parent",
        isActive: true,
      },
      null,
      { session }
    )
      .sort({ timestamp: -1 })
      .lean();

    if (!deleteLog) throwError("Parent restore history log not found", 404);

    let profileSnap = deleteLog.snapshot || {};
    let safeUserId = profileSnap.userId;
    const profileType = deleteLog.type;

    // 2. FALLBACK: Check DB if userId is missing from snapshot (as in original logic)
    if (!safeUserId) {
      const profileDoc = await Parent.findById(idStr)
        .setOptions({ includeDeleted: true })
        .select("userId")
        .session(session)
        .lean();

      if (!profileDoc || !profileDoc.userId)
        throwError(
          `Cannot restore. Linked parent profile or userId not found in DB.`,
          404
        );

      safeUserId = profileDoc.userId;

      if (Object.keys(profileSnap).length === 0) {
        profileSnap =
          (await Parent.findById(idStr)
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

    // 3. Restore Parent Profile
    await restoreDocumentFromSnapshot(
      // Assumes import
      Parent,
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

/* ============================================================================
  PERMANENT (HARD) DELETE PARENT PROFILE (Cascade) 💀
============================================================================ */
export const hardDeleteParentCascade = async (profileId, performedById) => {
  if (!mongoose.isValidObjectId(profileId))
    throwError("Invalid parent profile ID", 400);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the Parent Profile
    const parent = await Parent.findById(profileId)
      .select("userId children")
      .session(session);

    if (!parent) throwError("Parent profile not found", 404);

    // 2. CRITICAL: Unlink Students (Break the relationship permanently)
    if (parent.children && parent.children.length > 0) {
      await Student.updateMany(
        { _id: { $in: parent.children } },
        { $unset: { parent: 1 } }, // Permanently remove the parent field
        { session, includeDeleted: true } // Affect both active and soft-deleted students
      );
    }

    // 3. Hard Delete the Parent Profile
    await Parent.deleteOne({ _id: profileId }, { session });

    // 4. Hard Delete the linked User account
    await User.deleteOne({ userId: parent.userId }, { session });

    // 5. Optional: Deactivate Recycle History Log for this item (if it exists)
    await RecycleHistory.updateMany(
      { itemId: String(profileId) },
      { $set: { isActive: false } },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      message: "Parent and linked User permanently deleted. Students unlinked.",
    };
  } catch (err) {
    await session.abortTransaction();
    throwError(err.message || "Parent hard deletion failed", 500);
  } finally {
    session.endSession();
  }
};

/* ============================================================================
  LINKING HELPER (Needed for Student creation and Admin re-linking) 🔗
============================================================================ */
/**
 * Links a student profile to a parent profile.
 * Used when creating a student, or manually re-linking by an Admin.
 */
export const linkParentToStudent = async (
  studentProfileId,
  parentProfileId,
  session = null
) => {
  if (
    !mongoose.isValidObjectId(studentProfileId) ||
    !mongoose.isValidObjectId(parentProfileId)
  ) {
    throwError("Invalid Student or Parent Profile ID for linking.", 400);
  }

  const transactionRequired = session === null;
  const s = transactionRequired ? await mongoose.startSession() : session;
  if (transactionRequired) s.startTransaction();

  try {
    // 1. Update Student Profile: Set the parent field
    const updatedStudent = await Student.updateOne(
      { _id: studentProfileId, isDeleted: false },
      { $set: { parent: parentProfileId } },
      { session: s }
    );

    if (updatedStudent.matchedCount === 0) {
      throwError("Active student profile not found for linking.", 404);
    }

    // 2. Update Parent Profile: Add student ID to children array
    const updatedParent = await Parent.updateOne(
      { _id: parentProfileId, isDeleted: false },
      { $addToSet: { children: studentProfileId } }, // $addToSet ensures no duplicates
      { session: s }
    );

    if (updatedParent.matchedCount === 0) {
      throwError("Active parent profile not found for linking.", 404);
    }

    if (transactionRequired) await s.commitTransaction();

    return {
      success: true,
      message: "Student and Parent linked successfully.",
    };
  } catch (err) {
    if (transactionRequired) await s.abortTransaction();
    throw err;
  } finally {
    if (transactionRequired) s.endSession();
  }
};

// ============================================================================
// EXPORTS 📤
// ============================================================================
