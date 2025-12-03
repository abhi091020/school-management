// backend/models/admin/Subject.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    // ---------------------------------------------------------
    // SUBJECT BASIC INFO
    // ---------------------------------------------------------
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{3,5}\d{3}$/, "Subject code must be in format ABC123"],
    },

    // ---------------------------------------------------------
    // ASSIGNED TEACHERS
    // ---------------------------------------------------------
    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: async function (id) {
            if (!id) return true;
            const user = await mongoose
              .model("User")
              .findOne({ _id: id, role: "teacher", isDeleted: false });
            return !!user;
          },
          message: "Only active teachers can be assigned",
        },
      },
    ],

    // ---------------------------------------------------------
    // CLASSES USING THIS SUBJECT
    // ---------------------------------------------------------
    classes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Class",
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
  { timestamps: true }
);

/* ============================================================
   INDEXES (Cleaned + Soft-delete-safe)
============================================================ */

// Unique subject code (only active)
subjectSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Normal B-tree for filtering/sorting by name
subjectSchema.index({ name: 1 });

// Text search index (only one allowed)
subjectSchema.index({ name: "text" });

// Soft delete filter
subjectSchema.index({ isDeleted: 1 });

// Filter by status
subjectSchema.index({ status: 1 });

/* ============================================================
   SOFT DELETE METHOD
============================================================ */
subjectSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = "inactive";
  return this.save();
};

/* ============================================================
   AUTO-HIDE DELETED (Recycle Bin Compatible)
============================================================ */
subjectSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit includeDeleted=true → return deleted docs
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default → hide deleted
  this.where({ isDeleted: false });
});

export default mongoose.model("Subject", subjectSchema);
