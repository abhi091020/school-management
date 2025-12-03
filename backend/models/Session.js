// backend/models/Session.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Refresh Token — NOT UNIQUE (token rotation allowed)
    refreshToken: {
      type: String,
      required: true,
    },

    userAgent: { type: String, default: "Unknown" },
    ip: { type: String, default: null },

    // Device fingerprint
    fingerprint: {
      type: String,
      default: null,
    },

    lastActivity: { type: Date, default: Date.now },

    // TTL Index → expires automatically
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // KEEP — TTL index
    },

    rotatedAt: { type: Date, default: null },

    isValid: {
      type: Boolean,
      default: true,
    },

    revokedAt: { type: Date, default: null },

    revokedReason: {
      type: String,
      enum: [
        null,
        "logout",
        "expired",
        "fingerprint-mismatch",
        "single-device-session",
        "manual-revoke",
        "reuse-detected",
        "security-violation",
      ],
      default: null,
    },
  },
  { timestamps: true }
);

/* ======================================================
   CLEAN INDEXES (no duplicates)
====================================================== */

// For user session queries
sessionSchema.index({ userId: 1 });

// For token lookups
sessionSchema.index({ refreshToken: 1 });

// For device/session fraud detection
sessionSchema.index({ fingerprint: 1 });

// For filtering valid/invalid sessions
sessionSchema.index({ isValid: 1 });

// TTL index already defined in schema: expiresAt.index(expires=0)

/* ======================================================
   STATIC HELPERS
====================================================== */
sessionSchema.statics.invalidateUserSessions = async function (userId) {
  await this.updateMany(
    { userId },
    {
      $set: {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: "manual-revoke",
      },
    }
  );
};

sessionSchema.statics.invalidateToken = async function (refreshToken) {
  await this.updateOne(
    { refreshToken },
    {
      $set: {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: "manual-revoke",
      },
    }
  );
};

/* ======================================================
   INSTANCE METHODS
====================================================== */
sessionSchema.methods.touch = async function () {
  this.lastActivity = new Date();
  await this.save();
};

export default mongoose.model("Session", sessionSchema);
