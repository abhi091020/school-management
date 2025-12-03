// backend/models/admin/Class.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const classSchema = new Schema(
  {
    // ---------------------------------------------------------
    // CLASS BASIC INFO
    // ---------------------------------------------------------
    name: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
      match: /^[A-Z]$/,
    },

    // ---------------------------------------------------------
    // CLASS TEACHER (User)
    // ---------------------------------------------------------
    classTeacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ---------------------------------------------------------
    // SUBJECTS
    // ---------------------------------------------------------
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    // ---------------------------------------------------------
    // STUDENTS
    // ---------------------------------------------------------
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // ---------------------------------------------------------
    // STATUS
    // ---------------------------------------------------------
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      lowercase: true,
      trim: true,
    },

    // ---------------------------------------------------------
    // SOFT DELETE
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

/* =========================================================
   INDEXES (Soft Delete Safe)
========================================================= */

// Unique class "name + section" for active classes only
classSchema.index(
  { name: 1, section: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Query optimization
classSchema.index({ classTeacher: 1 });
classSchema.index({ status: 1 });

/* =========================================================
   SOFT DELETE METHOD
========================================================= */
classSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = "inactive"; // ensure consistency
  return this.save();
};

/* =========================================================
   AUTO FILTER SOFT DELETED (Recycle Bin Compatible)
========================================================= */
classSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Allow deleted results only when explicitly requested
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: only return non-deleted classes
  this.where({ isDeleted: false });
});

export default mongoose.model("Class", classSchema);
