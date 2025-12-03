// backend/models/admin/AdminProfile.js

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const adminProfileSchema = new Schema(
  {
    // =========================================================
    // LINK TO USER ACCOUNT
    // =========================================================
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // =========================================================
    // ADMIN DETAILS
    // =========================================================
    department: {
      type: String,
      trim: true,
      default: "Administration",
    },

    designation: {
      type: String,
      trim: true,
      required: [true, "Designation is required"],
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    // =========================================================
    // SOFT DELETE (Recycle Bin Compatible)
    // =========================================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ============================================================
   AUTO-FILTER SOFT DELETED
============================================================ */
// This middleware will hide deleted docs unless explicitly requested.
adminProfileSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Allow deleted docs only when explicitly requested
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: only return non-deleted records
  this.where({ isDeleted: false });
});

/* ============================================================
   EXPORT MODEL
============================================================ */
export default model("AdminProfile", adminProfileSchema);
