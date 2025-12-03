import mongoose from "mongoose";
import { hashPassword } from "../../utils/passwordUtils.js";

const { Schema, model } = mongoose;

const phoneRegex = /^\+?[0-9]{7,14}$/;

const userSchema = new Schema(
  {
    userId: { type: String, required: true, trim: true },

    name: { type: String, required: true, trim: true, maxlength: 80 },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
        "Invalid email format",
      ],
    },

    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent", "super_admin"],
      required: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || phoneRegex.test(v),
        message: "Invalid phone number",
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "active",
    },

    isFirstLogin: { type: Boolean, default: true },

    // SOFT DELETE
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // RESET FIELDS
    passwordResetToken: String,
    passwordResetExpires: Date,
    resetPasswordOTPHash: String,
    resetPasswordOTPSalt: String,
    resetPasswordOTPAttempts: Number,
    resetPasswordOTPExpiry: Date,
    canResetPassword: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ============================================================================
   INDEXES
============================================================================ */
userSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isDeleted: 1 });

/* ============================================================================
   PASSWORD HASH (SAVE)
============================================================================ */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (!this.password.startsWith("$2a$")) {
    this.password = await hashPassword(this.password, { skipValidation: true });
  }
  next();
});

/* ============================================================================
   PASSWORD HASH (UPDATE)
============================================================================ */
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  const newPass = update.password || update.$set?.password;

  if (newPass && !newPass.startsWith("$2a$")) {
    const hashed = await hashPassword(newPass, { skipValidation: true });

    if (update.password) update.password = hashed;
    if (update.$set?.password) update.$set.password = hashed;
  }

  next();
});

/* ============================================================================
   COMPARE PASSWORD
============================================================================ */
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.default.compare(enteredPassword, this.password);
};

/* ============================================================================
   SOFT DELETE AUTO-FILTER
============================================================================ */
userSchema.pre(/^find/, function () {
  const opts = this.getOptions();
  if (opts?.includeDeleted === true) return;
  this.where({ isDeleted: false });
});

export default model("User", userSchema);
