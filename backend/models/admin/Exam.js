// backend/models/admin/Exam.js

import mongoose from "mongoose";

const { Schema } = mongoose;

/* ============================================================
   EXAM SCHEMA
============================================================ */
const examSchema = new Schema(
  {
    // ---------------------------------------------------------
    // Basic Information
    // ---------------------------------------------------------
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ---------------------------------------------------------
    // Class & Subject Relationships
    // ---------------------------------------------------------
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // ---------------------------------------------------------
    // Exam Date
    // ---------------------------------------------------------
    examDate: {
      type: Date,
      required: true,
    },

    // ---------------------------------------------------------
    // Marks
    // ---------------------------------------------------------
    totalMarks: {
      type: Number,
      default: 100,
      min: [1, "Total marks must be at least 1"],
    },

    passingMarks: {
      type: Number,
      default: 35,
      min: [1, "Passing marks must be at least 1"],
      validate: {
        validator(value) {
          return value <= this.totalMarks;
        },
        message: "Passing marks cannot exceed total marks",
      },
    },

    // ---------------------------------------------------------
    // Status
    // ---------------------------------------------------------
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      lowercase: true,
      trim: true,
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
   INDEXES (No duplicates, soft-delete-safe)
============================================================ */

// Unique exam per class + subject + date (only active)
examSchema.index(
  { classId: 1, subjectId: 1, examDate: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Performance indexes
examSchema.index({ classId: 1 });
examSchema.index({ subjectId: 1 });
examSchema.index({ status: 1 });

/* ============================================================
   DATE NORMALIZATION
============================================================ */
function normalizeDate(date) {
  return new Date(new Date(date).setHours(0, 0, 0, 0));
}

examSchema.pre("save", function (next) {
  if (this.examDate) {
    this.examDate = normalizeDate(this.examDate);
  }
  next();
});

examSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const date = update?.examDate || update?.$set?.examDate;

  if (date) {
    const normalized = normalizeDate(date);
    if (update.examDate) update.examDate = normalized;
    if (update.$set?.examDate) update.$set.examDate = normalized;
  }

  next();
});

/* ============================================================
   SOFT DELETE
============================================================ */
examSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   AUTO-HIDE DELETED (Recycle Bin Compatible)
============================================================ */
examSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicitly include deleted
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: hide soft-deleted items
  this.where({ isDeleted: false });
});

export default mongoose.model("Exam", examSchema);
