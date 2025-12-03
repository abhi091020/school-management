// backend/models/admin/EmployeeProfile.js

import mongoose from "mongoose";

const { Schema } = mongoose;

/* ============================================================
   PHONE VALIDATION
============================================================ */
const phoneRegex = /^\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

/* ============================================================
   EMPLOYEE PROFILE SCHEMA (For Teachers and Admins)
============================================================ */
const employeeProfileSchema = new Schema(
  {
    /* ============================================================
       LINKED USER (Refers to the main User/Auth account)
       ============================================================ */
    userId: {
      type: String, // The ID of the User document (where the 'role' is stored: 'teacher' or 'admin')
      required: true,
      trim: true,
    },

    /* ============================================================
       EMPLOYMENT DETAILS
       ============================================================ */
    employeeId: {
      type: String,
      trim: true,
      required: true,
    },

    designation: {
      type: String,
      trim: true,
      required: true,
    },

    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    department: { type: String, trim: true },

    subjectSpecialization: {
      type: [String],
      default: [],
      // Relevant for Teachers, but kept optional for Admins
    },

    isFullTime: { type: Boolean, default: true },

    salaryGrade: { type: String, trim: true },

    /* ============================================================
       ADMIN-SPECIFIC FIELDS
       ============================================================ */
    canManageUsers: {
      type: Boolean,
      default: false,
      // Should be true for Admin roles
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
      // True for the highest level of administrative access
    },

    /* ============================================================
       PERSONAL DETAILS
       ============================================================ */
    name: {
      // Renamed from fullName
      type: String,
      trim: true,
      required: true,
    },

    dob: { type: Date },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      lowercase: true,
    },

    personalPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || phoneRegex.test(v),
        message: (props) =>
          `${props.value} is not a valid phone number format.`,
      },
    },

    personalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid personal email address"],
    },

    qualification: { type: [String], default: [] },

    /* ============================================================
       ADDRESS & EMERGENCY CONTACT
       ============================================================ */
    addressLine1: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },

    emergencyContactName: {
      type: String,
      trim: true,
      required: true,
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: (v) => phoneRegex.test(v),
        message: (props) =>
          `${props.value} is not a valid emergency phone number.`,
      },
    },

    /* ============================================================
       SOFT DELETE
       ============================================================ */
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

/* ============================================================
   SOFT DELETE METHOD
============================================================ */
employeeProfileSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   INDEXES (Ensure uniqueness for active profiles)
============================================================ */

// One profile per user (active only)
employeeProfileSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Unique employee ID (active only)
employeeProfileSchema.index(
  { employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Soft delete lookup
employeeProfileSchema.index({ isDeleted: 1 });

/* ============================================================
   AUTO-HIDE SOFT DELETED
============================================================ */
employeeProfileSchema.pre(/^find/, function () {
  const opts = this.getOptions();

  if (opts && opts.includeDeleted === true) {
    return;
  }

  this.where({ isDeleted: false });
});

export default mongoose.model("EmployeeProfile", employeeProfileSchema);
