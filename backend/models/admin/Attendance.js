// backend/models/admin/Attendance.js

import mongoose from "mongoose";

const { Schema } = mongoose;

/* ============================================================
   ATTENDANCE SCHEMA
============================================================ */
const attendanceSchema = new Schema(
  {
    // ---------------------------------------------------------
    // Student Reference
    // ---------------------------------------------------------
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // ---------------------------------------------------------
    // Class Reference
    // ---------------------------------------------------------
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    // ---------------------------------------------------------
    // Attendance Date
    // ---------------------------------------------------------
    date: {
      type: Date,
      required: true,
    },

    // ---------------------------------------------------------
    // Status
    // ---------------------------------------------------------
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
      lowercase: true,
      trim: true,
    },

    remarks: { type: String, trim: true },

    // ---------------------------------------------------------
    // Marked By (Teacher/Admin)
    // ---------------------------------------------------------
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ---------------------------------------------------------
    // Soft Delete
    // ---------------------------------------------------------
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
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
   INDEXES (Soft Delete Safe & Deduplicated)
============================================================ */

// Prevent duplicate attendance per student + class + date (only for non-deleted)
attendanceSchema.index(
  { studentId: 1, classId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Query performance indexes
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ classId: 1 });
attendanceSchema.index({ markedBy: 1 });

/* ============================================================
   NORMALIZE DATE
============================================================ */
attendanceSchema.pre("save", function (next) {
  if (this.date) {
    this.date = new Date(new Date(this.date).setHours(0, 0, 0, 0));
  }
  next();
});

attendanceSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const date = update?.date || update?.$set?.date;

  if (date) {
    const normalized = new Date(new Date(date).setHours(0, 0, 0, 0));

    if (update.date) update.date = normalized;
    if (update.$set?.date) update.$set.date = normalized;
  }

  next();
});

/* ============================================================
   AUTO-HIDE SOFT DELETED (Recycle Bin Compatible)
============================================================ */
attendanceSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit inclusion of deleted records
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default behavior: only return non-deleted
  this.where({ isDeleted: false });
});

/* ============================================================
   SOFT DELETE METHOD
============================================================ */
attendanceSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export default mongoose.model("Attendance", attendanceSchema);
