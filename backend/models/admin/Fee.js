// backend/models/admin/Fee.js

import mongoose from "mongoose";

const { Schema } = mongoose;

/* ============================================================
   PAYMENT SUBDOCUMENT
============================================================ */
const paymentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },

    date: { type: Date, default: Date.now },

    amount: { type: Number, required: true, min: 1 },

    method: {
      type: String,
      enum: ["cash", "card", "online", "cheque"],
      default: "cash",
      lowercase: true,
      trim: true,
    },

    reference: { type: String, trim: true },

    receiptUrl: { type: String },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

/* ============================================================
   FEE MAIN MODEL
============================================================ */
const feeSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["paid", "partial", "pending", "overdue"],
      default: "pending",
      lowercase: true,
      trim: true,
    },

    payments: {
      type: [paymentSchema],
      default: [],
    },

    notes: { type: String, trim: true },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ============================================================
   INDEXES (Cleaned & Soft-Delete-Safe)
============================================================ */

// Unique fee record for a student in a class
feeSchema.index(
  { studentId: 1, classId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Query helper indexes
feeSchema.index({ studentId: 1 });
feeSchema.index({ classId: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ status: 1 });

/* ============================================================
   RECALCULATION LOGIC
============================================================ */
feeSchema.methods.recalculate = function () {
  const totalPaid = (this.payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  this.paidAmount = Number(totalPaid.toFixed(2));
  this.balance = Number((this.totalAmount - this.paidAmount).toFixed(2));

  const now = new Date();

  if (this.balance <= 0) this.status = "paid";
  else if (now > this.dueDate) this.status = "overdue";
  else if (totalPaid > 0) this.status = "partial";
  else this.status = "pending";
};

/* ============================================================
   PRE-SAVE
============================================================ */
feeSchema.pre("save", function (next) {
  this.recalculate();
  next();
});

/* ============================================================
   PRE-UPDATE
============================================================ */
feeSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};

  const existing = await this.model.findOne(this.getQuery()).lean();
  if (!existing) return next();

  const merged = {
    ...existing,
    ...(update.$set || {}),
    ...update,
  };

  const temp = new this.model(merged);
  temp.recalculate();

  update.$set = update.$set || {};
  update.$set.paidAmount = temp.paidAmount;
  update.$set.balance = temp.balance;
  update.$set.status = temp.status;

  next();
});

/* ============================================================
   SOFT DELETE
============================================================ */
feeSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/* ============================================================
   AUTO HIDE DELETED (Recycle Bin Compatible)
============================================================ */
feeSchema.pre(/^find/, function () {
  const query = this.getQuery();

  // Return deleted only when explicitly requested
  if (query.includeDeleted === true) {
    delete query.includeDeleted;
    return;
  }

  // Default: hide deleted records
  this.where({ isDeleted: false });
});

/* ============================================================
   VIRTUAL — Total Paid (On Demand)
============================================================ */
feeSchema.virtual("totalPaidFromPayments").get(function () {
  return (this.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
});

/* ============================================================
   FULL POPULATION HELPER
============================================================ */
feeSchema.methods.fullInfo = function () {
  return this.populate([
    { path: "studentId", select: "name email classId" },
    { path: "classId", select: "name section classTeacher" },
  ]);
};

export default mongoose.model("Fee", feeSchema);
