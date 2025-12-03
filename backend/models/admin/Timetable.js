// backend/models/admin/Timetable.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const timetableSchema = new Schema(
  {
    // =========================================================
    // ASSOCIATIONS
    // =========================================================
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

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================================================
    // SCHEDULE DETAILS
    // =========================================================
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
      validate: {
        validator: function (v) {
          if (!this.startTime || !v) return true;
          return v > this.startTime; // Compare HH:MM strings
        },
        message: "endTime must be greater than startTime",
      },
    },

    room: { type: String, trim: true },

    // =========================================================
    // SOFT DELETE
    // =========================================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* ============================================================
   INDEXES (Soft-delete-safe)
============================================================ */

// Unique timetable entry only for active documents
timetableSchema.index(
  {
    classId: 1,
    subjectId: 1,
    teacherId: 1,
    day: 1,
    startTime: 1,
    endTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Query helper indexes
timetableSchema.index({ classId: 1 });
timetableSchema.index({ subjectId: 1 });
timetableSchema.index({ teacherId: 1 });
timetableSchema.index({ day: 1 });

/* ============================================================
   AUTO-HIDE DELETED (Recycle-bin compatible)
============================================================ */
timetableSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit includeDeleted=true → show deleted records
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default → hide deleted records
  this.where({ isDeleted: false });
});

/* ============================================================
   SOFT DELETE METHOD
============================================================ */
timetableSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   CLEAN JSON OUTPUT
============================================================ */
timetableSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

export default mongoose.model("Timetable", timetableSchema);
