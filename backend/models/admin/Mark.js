// backend/models/admin/Mark.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const markSchema = new Schema(
  {
    // =========================================================
    // RELATIONS
    // =========================================================
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // =========================================================
    // MARK DETAILS
    // =========================================================
    marksObtained: {
      type: Number,
      required: true,
      min: [0, "Marks cannot be negative"],
    },

    maxMarks: {
      type: Number,
      required: true,
      min: [1, "Max marks must be at least 1"],
    },

    percentage: Number,

    grade: {
      type: String,
      trim: true,
      enum: ["A", "B", "C", "D", "F"],
    },

    remarks: { type: String, trim: true },

    // =========================================================
    // GRADED BY (Teacher or Admin)
    // =========================================================
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async function (id) {
          if (!id) return true;

          const user = await mongoose.model("User").findById(id);
          return (
            user && ["teacher", "admin", "super_admin"].includes(user.role)
          );
        },
        message: "Marks can only be graded by a Teacher or Admin",
      },
    },

    // =========================================================
    // SOFT DELETE
    // =========================================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* =========================================================
   INDEXES — CLEAN & SOFT-DELETE SAFE
========================================================= */

markSchema.index(
  { studentId: 1, examId: 1, subjectId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

markSchema.index({ studentId: 1 });
markSchema.index({ examId: 1 });
markSchema.index({ subjectId: 1 });
markSchema.index({ percentage: 1 });
markSchema.index({ grade: 1 });

/* =========================================================
   HELPERS
========================================================= */
function calcPercentage(marks, max) {
  if (!max) return 0;
  return Number(((marks / max) * 100).toFixed(2));
}

function calcGrade(percentage) {
  if (percentage >= 90) return "A";
  if (percentage >= 75) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 45) return "D";
  return "F";
}

/* =========================================================
   PRE-SAVE
========================================================= */
markSchema.pre("save", function (next) {
  if (this.marksObtained > this.maxMarks) {
    return next(new Error("Marks obtained cannot exceed max marks"));
  }

  this.percentage = calcPercentage(this.marksObtained, this.maxMarks);
  this.grade = calcGrade(this.percentage);

  next();
});

/* =========================================================
   PRE-UPDATE (findOneAndUpdate)
========================================================= */
markSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  const set = update.$set || {};

  const marksProvided = set.marksObtained !== undefined;
  const maxProvided = set.maxMarks !== undefined;

  if (marksProvided || maxProvided) {
    const doc = await this.model.findOne(this.getQuery()).lean();
    if (!doc) return next(new Error("Document not found"));

    const marks = marksProvided ? set.marksObtained : doc.marksObtained;
    const max = maxProvided ? set.maxMarks : doc.maxMarks;

    if (marks > max)
      return next(new Error("Marks obtained cannot exceed max marks"));

    const percentage = calcPercentage(marks, max);

    set.percentage = percentage;
    set.grade = calcGrade(percentage);

    update.$set = set;
  }

  next();
});

/* =========================================================
   SOFT DELETE METHOD
========================================================= */
markSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* =========================================================
   AUTO HIDE DELETED (Recycle Bin Compatible)
========================================================= */
markSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit include of deleted data
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: hide deleted
  this.where({ isDeleted: false });
});

/* =========================================================
   POPULATE HELPER
========================================================= */
markSchema.methods.fullInfo = function () {
  return this.populate([
    { path: "studentId", select: "name email classId" },
    { path: "examId", select: "name examDate classId subjectId" },
    { path: "subjectId", select: "name code" },
    { path: "gradedBy", select: "name email role" },
  ]);
};

/* =========================================================
   CLEAN JSON OUTPUT
========================================================= */
markSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

export default mongoose.model("Mark", markSchema);
