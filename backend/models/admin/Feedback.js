// backend/models/admin/Feedback.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    // =========================================================
    // BASIC FEEDBACK DATA
    // =========================================================
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // =========================================================
    // SENDER (User)
    // =========================================================
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================================================
    // RECIPIENT (Admin or Teacher)
    // =========================================================
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async function (val) {
          if (!val) return true;
          const user = await mongoose.model("User").findOne({
            _id: val,
            isDeleted: false,
          });

          return (
            user && ["admin", "teacher", "super_admin"].includes(user.role)
          );
        },
        message: "Recipient must be an active admin or teacher",
      },
    },

    // =========================================================
    // TYPE / STATUS / PRIORITY
    // =========================================================
    type: {
      type: String,
      enum: ["general", "complaint", "suggestion"],
      default: "general",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    // =========================================================
    // ATTACHMENTS
    // =========================================================
    attachments: [
      {
        type: String,
        validate: {
          validator: function (file) {
            if (!file) return true;
            return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(file);
          },
          message:
            "Attachments must be jpg, jpeg, png, pdf, doc, or docx format.",
        },
      },
    ],

    // =========================================================
    // SOFT DELETE
    // =========================================================
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
   INDEXES
============================================================ */
feedbackSchema.index({
  sender: 1,
  recipient: 1,
  status: 1,
  priority: 1,
});

feedbackSchema.index({ isDeleted: 1 });

// Full-text search
feedbackSchema.index({ title: "text", message: "text" });

/* ============================================================
   SOFT DELETE
============================================================ */
feedbackSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   AUTO HIDE DELETED
============================================================ */
feedbackSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit includeDeleted
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: hide soft-deleted feedback
  this.where({ isDeleted: false });
});

/* ============================================================
   POPULATE HELPER
============================================================ */
feedbackSchema.methods.fullInfo = function () {
  return this.populate([
    { path: "sender", select: "name email role" },
    { path: "recipient", select: "name email role" },
  ]);
};

/* ============================================================
   CLEAN RESPONSE PAYLOAD
============================================================ */
feedbackSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

export default mongoose.model("Feedback", feedbackSchema);
