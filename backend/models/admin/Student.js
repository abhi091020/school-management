// backend/models/admin/Student.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    /* =========================================================
       LINKED USER (STRING-BASED LINKING)
       ========================================================= */
    userId: {
      type: String, // CHANGED from ObjectId → String
      required: true,
      trim: true,
    },

    /* =========================================================
       LINKED PARENT (STILL OBJECTID)
       ========================================================= */
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },

    admissionNumber: {
      type: String,
      trim: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    division: { type: String, trim: true },
    previousSchool: { type: String, trim: true },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    dob: { type: Date, required: true },

    bloodGroup: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    category: { type: String, trim: true },
    medicalNotes: { type: String, trim: true },

    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 10,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      lowercase: true,
    },

    /* =========================================================
       SOFT DELETE FIELDS
       ========================================================= */
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
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

/* =========================================================
   INDEXES (Updated for String userId)
========================================================= */
studentSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

studentSchema.index(
  { admissionNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

studentSchema.index(
  { classId: 1, academicYear: 1, rollNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

studentSchema.index({ isDeleted: 1 });
studentSchema.index({ parent: 1 });
studentSchema.index({ classId: 1 });

/* =========================================================
   AUTO-HIDE SOFT DELETED DOCUMENTS
========================================================= */
studentSchema.pre(/^find/, function () {
  const opts = this.getOptions();

  if (opts && opts.includeDeleted === true) {
    return;
  }

  this.where({ isDeleted: false });
});

export default mongoose.model("Student", studentSchema);
