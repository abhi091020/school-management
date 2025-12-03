// backend/models/admin/Event.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    // =========================================================
    // EVENT DETAILS
    // =========================================================
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      validate: {
        validator: function (val) {
          return !val || val >= this.startDate;
        },
        message: "End date cannot be earlier than start date",
      },
    },

    location: { type: String, trim: true },

    // =========================================================
    // CREATED BY (User)
    // =========================================================
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================================================
    // AUDIENCE
    // =========================================================
    audience: {
      type: [String],
      enum: ["all", "student", "teacher", "parent"],
      default: ["all"],
      lowercase: true,
      trim: true,
    },

    isActive: { type: Boolean, default: true },

    // =========================================================
    // SOFT DELETE FIELDS
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
   AUDIENCE VALIDATION
============================================================ */
function validateAudience(audience, next) {
  if (Array.isArray(audience)) {
    if (audience.includes("all") && audience.length > 1) {
      return next(
        new Error('Audience "all" cannot be combined with other roles')
      );
    }
  }
  next();
}

eventSchema.pre("save", function (next) {
  validateAudience(this.audience, next);
});

eventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const audience = update?.audience || update?.$set?.audience;

  if (audience) validateAudience(audience, next);
  next();
});

/* ============================================================
   DATE NORMALIZATION
============================================================ */
function normalizeDate(date) {
  return new Date(new Date(date).setMinutes(0, 0, 0));
}

eventSchema.pre("save", function (next) {
  if (this.startDate) this.startDate = normalizeDate(this.startDate);
  if (this.endDate) this.endDate = normalizeDate(this.endDate);
  next();
});

eventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.startDate) update.startDate = normalizeDate(update.startDate);
  if (update.endDate) update.endDate = normalizeDate(update.endDate);

  next();
});

/* ============================================================
   SOFT DELETE
============================================================ */
eventSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   AUTO-HIDE DELETED (Recycle Bin Compatible)
============================================================ */
eventSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Explicit include deleted
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  this.where({ isDeleted: false });
});

/* ============================================================
   VIRTUAL: EVENT STATUS
============================================================ */
eventSchema.virtual("status").get(function () {
  const now = new Date();

  if (this.startDate > now) return "upcoming";
  if (this.endDate && this.endDate < now) return "past";

  return "ongoing";
});

/* ============================================================
   CLEAN INDEXES
============================================================ */
eventSchema.index({ isDeleted: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ audience: 1 });

export default mongoose.model("Event", eventSchema);
