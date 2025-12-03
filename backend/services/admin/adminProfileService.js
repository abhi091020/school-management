import AdminProfile from "../../models/admin/AdminProfile.js";
import { throwError } from "../../utils/response.js";
import mongoose from "mongoose";

/* ============================================================
   CREATE ADMIN PROFILE
   - Transaction-safe
   - Prevent duplicate profile creation
============================================================ */
export const createAdminProfile = async (profileData, session = null) => {
  const { userId, department, designation, joiningDate } = profileData;

  try {
    const [newProfile] = await AdminProfile.create(
      [
        {
          userId,
          department: department || "Administration",
          designation: designation || "Admin",
          joiningDate: joiningDate || new Date(),
        },
      ],
      { session }
    );

    return newProfile.toObject();
  } catch (error) {
    console.error("Admin Profile Creation Error:", error);

    // Duplicate key error
    if (error.code === 11000) {
      throwError("A detailed admin profile already exists for this user.", 409);
    }

    // Mongoose Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      throwError(`Validation failed for admin profile: ${error.message}`, 400);
    }

    // Generic failure
    throwError("Failed to complete admin profile creation.", 500);
  }
};

/* ============================================================
   SOFT DELETE ADMIN PROFILE
   - Used during user soft-delete cascade
============================================================ */
export const softDeleteAdminProfile = async (userId, session = null) => {
  const profile = await AdminProfile.findOneAndUpdate(
    { userId },
    { isDeleted: true, deletedAt: new Date() },
    { new: true, session }
  );

  if (!profile) {
    console.warn(
      `Admin profile for user ${userId} not found during soft-delete, continuing.`
    );
  }

  return profile;
};
