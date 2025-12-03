// backend/models/admin/Parent.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const phoneRegex = /^\+?\d{7,14}$/;

const parentSchema = new Schema(
  {
    /* ============================================================
       LINKED USER (STRING userId → must match User.userId)
    ============================================================ */
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    /* ============================================================
       CHILDREN (Array of Student ObjectIds)
    ============================================================ */
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    /* ============================================================
       PARENT DETAILS
    ============================================================ */
    fatherName: { type: String, trim: true, maxlength: 100 },
    fatherPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || phoneRegex.test(v),
        message: "Invalid father phone number.",
      },
    },

    motherName: { type: String, trim: true, maxlength: 100 },
    motherPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || phoneRegex.test(v),
        message: "Invalid mother phone number.",
      },
    },

    occupation: { type: String, trim: true },
    annualIncome: { type: Number, min: 0 },
    familyStatus: { type: String, trim: true },

    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true, minlength: 4, maxlength: 10 },

    emergencyContactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || phoneRegex.test(v),
        message: "Invalid emergency phone number.",
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
   AUTO FILTER SOFT DELETED
============================================================ */
parentSchema.pre(/^find/, function () {
  const opts = this.getOptions();
  if (opts && opts.includeDeleted === true) return;
  this.where({ isDeleted: false });
});

/* ============================================================
   CLEAN PHONE INPUTS
============================================================ */
parentSchema.pre("save", function (next) {
  if (this.fatherPhone) this.fatherPhone = this.fatherPhone.trim();
  if (this.motherPhone) this.motherPhone = this.motherPhone.trim();
  if (this.emergencyContactPhone)
    this.emergencyContactPhone = this.emergencyContactPhone.trim();
  next();
});

/* For update operations */
parentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const fields = ["fatherPhone", "motherPhone", "emergencyContactPhone"];

  fields.forEach((f) => {
    if (update[f]) update[f] = update[f].trim();
    if (update.$set?.[f]) update.$set[f] = update.$set[f].trim();
  });

  next();
});

/* ============================================================
   VIRTUALS
============================================================ */
parentSchema.virtual("childrenCount").get(function () {
  return this.children?.length || 0;
});

/* ============================================================
   INDEXES
   - userId unique for active (not-deleted) parents
============================================================ */
parentSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

parentSchema.index({ children: 1 });

export default mongoose.model("Parent", parentSchema);
