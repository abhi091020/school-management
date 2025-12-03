// backend/models/admin/Notification.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // =========================================================
    // NOTIFICATION CONTENT
    // =========================================================
    title: { type: String, required: true, trim: true, maxlength: 200 },

    message: { type: String, required: true, trim: true, maxlength: 2000 },

    type: {
      type: String,
      enum: ["info", "exam", "fee", "announcement"],
      default: "info",
      lowercase: true,
      trim: true,
    },

    // =========================================================
    // TARGETING
    // =========================================================
    targetType: {
      type: String,
      enum: ["user", "class", "role", "all"],
      required: true,
      default: "all",
    },

    targetUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    targetClasses: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    targetRoles: [
      { type: String, enum: ["admin", "teacher", "student", "parent"] },
    ],

    isGlobal: { type: Boolean, default: false },

    // =========================================================
    // READ RECEIPTS
    // =========================================================
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date },
      },
    ],

    // =========================================================
    // CREATOR
    // =========================================================
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================================================
    // SOFT DELETE
    // =========================================================
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* ============================================================
   INDEXES
============================================================ */

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetType: 1 });
notificationSchema.index({ isDeleted: 1 });

notificationSchema.index(
  { "readBy.userId": 1 },
  { partialFilterExpression: { isDeleted: false } }
);

notificationSchema.index({ title: "text", message: "text" });

/* ============================================================
   VALIDATION
============================================================ */
notificationSchema.pre("save", function (next) {
  // Auto-set global flag
  if (this.targetType === "all") this.isGlobal = true;

  if (this.targetType !== "all" && this.isGlobal) {
    return next(
      new Error("isGlobal can only be true when targetType is 'all'")
    );
  }

  if (
    this.targetType === "user" &&
    (!this.targetUsers || this.targetUsers.length === 0)
  ) {
    return next(
      new Error("targetUsers must not be empty for user notifications")
    );
  }

  if (
    this.targetType === "class" &&
    (!this.targetClasses || this.targetClasses.length === 0)
  ) {
    return next(
      new Error("targetClasses must not be empty for class notifications")
    );
  }

  if (
    this.targetType === "role" &&
    (!this.targetRoles || this.targetRoles.length === 0)
  ) {
    return next(
      new Error("targetRoles must not be empty for role notifications")
    );
  }

  next();
});

/* ============================================================
   MARK AS READ (Idempotent)
============================================================ */
notificationSchema.methods.markAsRead = async function (userId) {
  const exists = this.readBy.some(
    (x) => x.userId.toString() === userId.toString()
  );

  if (!exists) {
    this.readBy.push({ userId, readAt: new Date() });
    await this.save();
  }

  return this;
};

/* ============================================================
   SOFT DELETE
============================================================ */
notificationSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   AUTO-HIDE DELETED
============================================================ */
notificationSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit includeDeleted=true → show deleted
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default → hide deleted
  this.where({ isDeleted: false });
});

/* ============================================================
   CLEAN JSON OUTPUT
============================================================ */
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

export default mongoose.model("Notification", notificationSchema);
