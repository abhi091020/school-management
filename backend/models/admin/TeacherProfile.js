// backend/models/admin/TeacherProfile.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const teacherProfileSchema = new Schema(
  {
    // =========================================================
    // CORE LINK: ONE USER → ONE TEACHER PROFILE
    // =========================================================
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // =========================================================
    // EMPLOYMENT DETAILS
    // =========================================================
    designation: {
      type: String,
      trim: true,
      default: "Teacher",
    },

    qualification: {
      type: String,
      required: [true, "Qualification is required"],
      trim: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    // =========================================================
    // ASSIGNMENTS
    // =========================================================
    assignedClasses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    assignedSubjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    // =========================================================
    // CLASS TEACHER FLAG
    // =========================================================
    isClassTeacher: {
      type: Boolean,
      default: false,
    },

    // =========================================================
    // SOFT DELETE
    // =========================================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ============================================================
   SOFT DELETE METHOD
============================================================ */
teacherProfileSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   AUTO-HIDE DELETED (Recycle Bin Compatible)
============================================================ */
teacherProfileSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit includeDeleted=true → show soft-deleted records
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: hide soft-deleted profiles
  this.where({ isDeleted: false });
});

/* ============================================================
   INDEXES (Soft delete safe)
============================================================ */
teacherProfileSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export default mongoose.model("TeacherProfile", teacherProfileSchema);
