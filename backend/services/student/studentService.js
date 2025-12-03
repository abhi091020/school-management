// backend/services/student/studentService.js

import mongoose from "mongoose";

/* MODELS */
import User from "../../models/admin/User.js"; // Needed for linking and update operations
import Student from "../../models/admin/Student.js";
import Parent from "../../models/admin/Parent.js";
import RecycleHistory from "../../models/admin/RecycleHistory.js";

/* UTILS */
import { throwError } from "../../utils/response.js";
import generateUserId from "../../utils/generateUserId.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import { logRecycleEvent } from "../../utils/recycleLogger.js";
import { normalizeSnapshot } from "../../utils/recycleUtils.js";

// --- IMPORT NECESSARY FUNCTIONS FROM OTHER SERVICES ---

// Import generic transactional helpers and User creation from userService.js
import {
  createUser,
  restoreDocumentFromSnapshot,
  softDelete,
} from "../admin/userService.js";

// ✅ CORRECTED IMPORT: Import the Parent creation helper from its new location in parentService.js
// NOTE: createNewParentFromPayload only creates the profile/user, returning the profile ID
import { createNewParentFromPayload } from "../parent/parentService.js";

// --- Student-Specific Models/Utils ---

/* ============================================================================
    HELPERS & VALIDATIONS
============================================================================ */

const DEFAULT_USER_PASSWORD = (
  process.env.DEFAULT_USER_PASSWORD || "School@2025"
).trim();

// INTERNAL HELPER: Creates a new Parent User and Profile
// NOTE: This helper is retained here because the transactional logic in this file
// uses it. For maximum cleanliness, this logic should be entirely in parentService.js
async function createNewParentProfileAndUser(parentPayload, session) {
  if (!parentPayload?.user || !parentPayload?.parent) {
    throwError(
      "Missing required 'user' or 'parent' fields for parent creation.",
      400
    );
  }

  // 1. Create the Parent User
  const parentUser = await createUser(
    {
      name:
        parentPayload.user.name ||
        parentPayload.parent.fatherName ||
        parentPayload.parent.motherName,
      email:
        parentPayload.parent.fatherName.toLowerCase().replace(/\s/g, "") +
        "@school.com",
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

  return { parentProfile, parentUser };
}

/* ============================================================================
    READ OPERATIONS (ADMIN & SELF) 📚
============================================================================ */

/**
 * Retrieves a list of student profiles, filtered, searched, and paginated. (Needed by Admin Controller)
 */
export const listStudents = async ({
  page = 1,
  limit = 20,
  search = "", // For searching by admission number, name, etc.
  classId = null, // Optional filter by class
  status = "active", // Default filter for active students
  sortBy = "admissionNumber",
  sortOrder = 1, // Ascending order for admission number
  includeDeleted = false,
}) => {
  const query = {};

  // 1. Filter deleted status
  if (!includeDeleted) query.isDeleted = false;

  // 2. Filter by status
  if (status && status !== "all") query.status = status;

  // 3. Filter by class
  if (classId && mongoose.isValidObjectId(classId)) {
    query.classId = classId;
  }

  // 4. Handle search term
  if (search.trim()) {
    const r = new RegExp(search.trim(), "i");
    // NOTE: For a proper name search, aggregation is needed, but we stick to direct fields for now.
    query.$or = [{ admissionNumber: r }, { rollNumber: r }];
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  const students = await Student.find(query)
    .populate({
      path: "userId",
      select: "name email phone role", // Include User details (name is critical)
    })
    .populate({ path: "classId", select: "name section" }) // Include Class name
    .sort({ [sortBy]: sortOrder })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await Student.countDocuments(query);

  return {
    data: students,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Retrieves the full student profile by its MongoDB document _id. (Needed by Admin Controller)
 */
export const getStudentProfileById = async (profileId) => {
  if (!mongoose.isValidObjectId(profileId)) {
    throwError("Invalid student profile ID", 400);
  }

  const profile = await Student.findById(profileId)
    .populate({ path: "userId", select: "name email phone status role" })
    .populate({ path: "classId", select: "name section classTeacher" })
    .populate({ path: "parent", select: "-children" }) // Exclude children list from parent
    .lean();

  if (!profile) throwError("Student profile not found.", 404);
  return profile;
};

/**
 * Retrieves the student profile by the linked string userId. (Self-Service)
 */
export const getStudentProfileByUserId = async (userId) => {
  const profile = await Student.findOne({
    userId: String(userId),
    isDeleted: false,
  })
    .populate({ path: "classId", select: "name section classTeacher" })
    .populate({ path: "parent", select: "-children" })
    .lean();

  if (!profile) throwError("Student profile not found.", 404);
  return profile;
};

/* ============================================================================
    CREATE STUDENT AND PARENT (Transactional)
    MOVED FROM: userService.js: createStudentAndParent
============================================================================ */
// FIX APPLIED: Removed the surrounding asyncHandler()
export const createStudentAndParent = async (payload) => {
  if (!payload?.user || !payload?.student || !payload?.parent)
    throwError("Missing required fields (user, student, parent)", 400);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create Student User Account
    const studentUser = await createUser(
      // Assumes createUser is robustly imported
      {
        name: payload.user.name,
        email: payload.user.email,
        phone: payload.user.phone,
        role: "student",
      },
      session
    );

    // 2. Create Parent User Account & Profile
    // FIX APPLIED: Pass the entire payload object which contains both .user and .parent
    const { parentProfile, parentUser } = await createNewParentProfileAndUser(
      payload, // 👈 CORRECTED HERE
      session
    );

    // 3. Create Student Profile
    const admissionNumber = await generateUserId("student", { prefix: "S" });

    const studentPayload = {
      userId: studentUser.userId,
      parent: parentProfile._id,
      admissionNumber,
      ...payload.student,
    };

    // Convert ONLY parent & classId to ObjectId
    studentPayload.parent = new mongoose.Types.ObjectId(studentPayload.parent);
    studentPayload.classId = new mongoose.Types.ObjectId(
      studentPayload.classId
    );

    const [studentProfile] = await Student.create(
      [
        {
          ...studentPayload,
          isDeleted: false,
          deletedAt: null,
        },
      ],
      { session }
    );

    // 4. Link Student to Parent Profile
    await Parent.updateOne(
      { _id: parentProfile._id },
      { $addToSet: { children: studentProfile._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      user: studentUser,
      profile: studentProfile,
      parent: parentProfile,
      admissionNumber: studentProfile.admissionNumber,
    };
  } catch (err) {
    await session.abortTransaction();
    throwError(err.message || "Student creation failed", 500);
  } finally {
    session.endSession();
  }
};

/* ============================================================================
    UPDATE STUDENT PROFILE (Includes Parent Linkage Transactional)
    MOVED FROM: userService.js: updateStudentProfileAndParentLink
============================================================================ */
export const updateStudentProfileAndParentLink = async (
  studentProfileId,
  payload
) => {
  if (!mongoose.isValidObjectId(studentProfileId))
    throwError("Invalid student profile ID", 400);

  let finalParentProfileId = null;

  // Check if the payload contains the full parent object structure (for re-creation)
  const isNewParentCreationAttempt =
    payload.parent &&
    typeof payload.parent === "object" &&
    !mongoose.isValidObjectId(payload.parent);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Handle NEW Parent Creation / ID Determination
    if (isNewParentCreationAttempt) {
      // If the parent details are provided, CREATE the new parent user and profile
      finalParentProfileId = await createNewParentFromPayload(
        payload.parent,
        session
      );
      // Replace the complex parent object in the payload with the new ID
      payload.parent = finalParentProfileId;
    } else if (payload.parent && mongoose.isValidObjectId(payload.parent)) {
      // If the payload contains a valid ObjectId, use it for linking
      finalParentProfileId = payload.parent;
    }
    // If payload.parent is null/undefined, we will skip linkage logic

    // 2. Find the current student profile
    const student = await Student.findById(studentProfileId)
      .select("_id user parent userId isDeleted")
      .session(session);

    if (!student || student.isDeleted)
      throwError("Student profile not found", 404);

    const oldParentId = student.parent;
    const studentObjId = student._id;

    // 3. Handle Parent Linkage/Swapping Logic (Only if a valid ID is involved)
    if (finalParentProfileId) {
      const newParentId = finalParentProfileId;

      // Check if the parent link is actually changing
      if (String(oldParentId) !== String(newParentId)) {
        // A. Find the new parent profile
        const newParent = await Parent.findById(newParentId)
          .select("_id isDeleted")
          .session(session);

        if (!newParent || newParent.isDeleted) {
          throwError("New parent profile not found or is deleted", 404);
        }

        // B. Update the old parent (if one existed and is not the new one)
        if (oldParentId) {
          await Parent.updateOne(
            { _id: oldParentId },
            { $pull: { children: studentObjId } }, // Remove student from old parent
            { session, includeDeleted: true } // allow update even if old parent is soft-deleted
          );
        }

        // C. Update the new parent (either newly created or existing)
        await Parent.updateOne(
          { _id: newParentId },
          { $addToSet: { children: studentObjId } }, // Add student to new parent
          { session }
        );
      } else {
        // Parent ID is the same as the current linked parent, remove from payload to avoid unnecessary db update
        delete payload.parent;
      }
    }

    // Clean payload for Student Profile update
    const profileUpdates = { ...payload };
    delete profileUpdates.user;

    // 4. Update the Student Profile with remaining fields
    const updatedStudent = await Student.findOneAndUpdate(
      { _id: studentProfileId, isDeleted: false },
      { $set: profileUpdates },
      { new: true, runValidators: true, session }
    )
      .populate({ path: "parent", select: "-children" }) // Populate the new parent profile
      .lean();

    // 5. Update the Student's User Account (if user details were in the payload)
    let updatedUser = null;
    if (payload.user) {
      // Find the User document by the string userId on the Student Profile
      const userToUpdate = await User.findOne(
        { userId: student.userId, isDeleted: false },
        null,
        { session }
      );

      if (userToUpdate) {
        // Handle password hashing if provided
        if (payload.user.password) {
          payload.user.password = await hashPassword(payload.user.password, {
            skipValidation: true,
          });
        }

        updatedUser = await User.findOneAndUpdate(
          { _id: userToUpdate._id },
          { $set: payload.user },
          { new: true, select: "-password", session }
        ).lean();
      }
    }

    if (!updatedStudent) throwError("Failed to update student profile", 500);

    await session.commitTransaction();

    return {
      student: updatedStudent,
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

/**
 * Updates the Student profile (only profile fields) based on the linked string userId.
 * This is used for self-service updates by the student.
 */
export const updateStudentProfile = async (userId, updates) => {
  // 1. Find the current profile by the string userId and update
  const updated = await Student.findOneAndUpdate(
    { userId: String(userId), isDeleted: false },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate({ path: "classId", select: "name section" })
    .populate({ path: "parent", select: "-children" })
    .lean();

  if (!updated) throwError("Student profile not found.", 404);
  return updated;
};

/* ============================================================================
    SOFT DELETE STUDENT PROFILE (Cascade)
============================================================================ */
export const softDeleteStudentCascade = async (
  userToDeleteId,
  performedById
) => {
  // ... (Existing softDeleteStudentCascade logic) ...
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
    if (!user || user.role.toLowerCase() !== "student")
      throwError("Student user not found", 404);

    const userIdString = user.userId;

    // 1. Find the Student Profile
    const student = await Student.findOne({ userId: userIdString }).session(
      session
    );

    if (student) {
      // 2. Prepare Snapshot for Recycle History
      const studentObj = student.toObject();
      studentObj.email = user.email;

      // Fetch Parent User ID for snapshot
      const parentDoc = await Parent.findById(student.parent, "userId")
        .session(session)
        .lean();

      if (parentDoc) {
        studentObj.parentUserId = parentDoc.userId; // Parent User ID
      }

      const snap = await normalizeSnapshot(studentObj);

      // 3. Soft Delete Profile
      await softDelete(Student, student._id, session);

      // 4. Log ONLY student profile deletion
      await logRecycleEvent({
        session,
        itemId: String(student._id),
        type: "student",
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
    throwError(err.message || "Student deletion failed", 500);
  } finally {
    session.endSession();
  }
};

/* ============================================================================
    RESTORE STUDENT PROFILE (Cascade)
============================================================================ */
export const restoreStudentCascade = async (profileId, performedById) => {
  // ... (Existing restoreStudentCascade logic) ...
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
        type: "student",
        isActive: true,
      },
      null,
      { session }
    )
      .sort({ timestamp: -1 })
      .lean();

    if (!deleteLog) throwError("Student restore history log not found", 404);

    let profileSnap = deleteLog.snapshot || {};
    let safeUserId = profileSnap.userId;

    // 2. FALLBACK: Check DB if userId is missing from snapshot (as in original logic)
    if (!safeUserId) {
      const profileDoc = await Student.findById(idStr)
        .setOptions({ includeDeleted: true })
        .select("userId")
        .session(session)
        .lean();

      if (!profileDoc || !profileDoc.userId)
        throwError(
          `Cannot restore. Linked student profile or userId not found in DB.`,
          404
        );

      safeUserId = profileDoc.userId;

      if (Object.keys(profileSnap).length === 0) {
        profileSnap =
          (await Student.findById(idStr)
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

    // 3. Restore Student Profile (using the transactional helper)
    await restoreDocumentFromSnapshot(
      Student,
      profileObjId,
      profileSnap,
      session
    );

    // 4. Restore Parent Link
    // Check if parent ID is available in the snapshot
    if (profileSnap.parent) {
      const parentDoc = await Parent.findOne(
        { _id: profileSnap.parent },
        null,
        { session }
      ).setOptions({ includeDeleted: true });

      // Use $addToSet to safely re-link the child to the parent (even if parent is deleted)
      if (parentDoc) {
        await Parent.updateOne(
          { _id: profileSnap.parent },
          { $addToSet: { children: profileObjId } },
          { session, includeDeleted: true }
        );
      }
    }

    // 5. Restore linked User account
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

    // 6. Log restore event
    await logRecycleEvent({
      session,
      itemId: idStr,
      type: "student",
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
