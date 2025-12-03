// services/admin/feeService.js

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

import Fee from "../../models/admin/Fee.js";
import User from "../../models/admin/User.js";
import Class from "../../models/admin/Class.js";

/* ============================================================
   ENV + RECEIPT SETUP
============================================================ */
const ENABLE_RECEIPT = process.env.ENABLE_RECEIPT === "true";
const RECEIPT_DIR = process.env.RECEIPT_DIR || "public/receipts";
const RECEIPT_BASE_URL = process.env.RECEIPT_BASE_URL || "";

if (ENABLE_RECEIPT) {
  try {
    fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  } catch (_) {}
}

let transporter = null;
if (ENABLE_RECEIPT && process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/* ============================================================
   HELPERS
============================================================ */
const safeNumber = (n, fallback = 1, max = 1000) => {
  const v = parseInt(n);
  if (isNaN(v) || v <= 0) return fallback;
  return Math.min(v, max);
};

const normalizeIncludeDeleted = (v) => v === true || v === "true" || v === "1";

const validateStudentAndClass = async (studentId, classId) => {
  if (!mongoose.isValidObjectId(studentId))
    throw new Error("Invalid studentId");
  if (!mongoose.isValidObjectId(classId)) throw new Error("Invalid classId");

  const student = await User.findOne({
    _id: studentId,
    role: "student",
    isDeleted: false,
    status: "active",
  });

  if (!student) throw new Error("Student not found or inactive");
  if (!student.classId) throw new Error("Student not assigned to any class");
  if (student.classId.toString() !== classId.toString())
    throw new Error("Student does not belong to this class");

  const classObj = await Class.findOne({ _id: classId, isDeleted: false });
  if (!classObj) throw new Error("Class not found");
};

const ensureTeacherPermissionForClass = async (teacherId, classId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: "teacher",
    isDeleted: false,
    status: "active",
  });

  if (!teacher) throw new Error("Teacher not found or inactive");

  const allowed = (teacher.assignedClasses || []).map(String);
  if (!allowed.includes(String(classId)))
    throw new Error("You are not assigned to this class");
};

/* ============================================================
   RECEIPT PDF
============================================================ */
const generateReceiptPdf = async (fee, payment, student) => {
  if (!ENABLE_RECEIPT) return null;

  const filename = `receipt_${fee._id}_${payment._id}.pdf`;
  const filepath = path.join(RECEIPT_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      doc.fontSize(18).text("Payment Receipt", { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Receipt ID: ${payment._id}`);
      doc.text(`Date: ${new Date(payment.date).toDateString()}`);
      doc.text(`Student: ${student.name}`);
      doc.text(`Amount: ${payment.amount}`);
      doc.text(`Method: ${payment.method}`);
      if (payment.reference) doc.text(`Reference: ${payment.reference}`);
      doc.moveDown();

      doc.text(`Total Fee: ${fee.totalAmount}`);
      doc.text(`Paid After Payment: ${fee.paidAmount}`);
      doc.text(`Balance: ${fee.balance}`);
      doc.end();

      stream.on("finish", () =>
        resolve(
          RECEIPT_BASE_URL
            ? `${RECEIPT_BASE_URL}/${filename}`
            : `/receipts/${filename}`
        )
      );
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

/* ============================================================
   EMAIL RECEIPT
============================================================ */
const sendReceiptEmail = async (email, subject, text, url) => {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: `<p>${text}</p>${
        url ? `<p><a href="${url}">Download Receipt</a></p>` : ""
      }`,
    });
  } catch (err) {
    console.error("Receipt email error:", err);
  }
};

/* ============================================================
   SERVICE API (MATCHES CONTROLLER EXACTLY)
============================================================ */

/* ---------------------- GET ALL (includeDeleted supported) ---------------------- */
export const getAllFeeRecords = async (query = {}) => {
  const page = safeNumber(query.page, 1);
  const limit = safeNumber(query.limit, 50);
  const skip = (page - 1) * limit;

  const includeDeleted = normalizeIncludeDeleted(query.includeDeleted);

  const filter = {};

  if (!includeDeleted) filter.isDeleted = false;
  if (query.studentId) filter.studentId = query.studentId;
  if (query.classId) filter.classId = query.classId;
  if (query.status) filter.status = query.status.toLowerCase();

  if (query.search) {
    const safe = escapeStringRegexp(query.search);
    filter.$or = [{ notes: new RegExp(safe, "i") }];
  }

  const fees = await Fee.find(filter)
    .populate("studentId", "name email classId")
    .populate("classId", "name section classTeacher")
    .skip(skip)
    .limit(limit)
    .sort({ dueDate: 1 })
    .lean();

  const total = await Fee.countDocuments(filter);

  return {
    fees,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/* ---------------------- GET ONE (includeDeleted supported) ---------------------- */
export const getFeeRecordById = async (id, query = {}) => {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid fee ID");

  const includeDeleted = normalizeIncludeDeleted(query.includeDeleted);

  const filter = { _id: id };
  if (!includeDeleted) filter.isDeleted = false;

  return Fee.findOne(filter)
    .populate("studentId", "name email classId")
    .populate("classId", "name section classTeacher");
};

/* ---------------------- CREATE ---------------------- */
export const createFeeRecord = async (data) => {
  await validateStudentAndClass(data.studentId, data.classId);

  const existing = await Fee.findOne({
    studentId: data.studentId,
    classId: data.classId,
    isDeleted: false,
  });

  if (existing)
    throw new Error("Fee already exists for this student in this class");

  const created = await Fee.create(data);
  return created.fullInfo ? created.fullInfo() : created;
};

/* ---------------------- UPDATE ---------------------- */
export const updateFeeRecordById = async (id, updates) => {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid fee ID");

  delete updates.studentId;
  delete updates.classId;
  delete updates.payments;
  delete updates.paidAmount;
  delete updates.balance;
  delete updates.status;

  const updated = await Fee.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  );

  if (!updated) throw new Error("Fee record not found");
  return updated.fullInfo ? updated.fullInfo() : updated;
};

/* ---------------------- ADD PAYMENT ---------------------- */
export const addPayment = async (data, actorId) => {
  const { feeId, ...payment } = data;

  if (!mongoose.isValidObjectId(feeId)) throw new Error("Invalid fee ID");

  const actor = await User.findById(actorId).lean();
  if (!actor) throw new Error("Invalid actor");

  const fee = await Fee.findOne({ _id: feeId, isDeleted: false });
  if (!fee) throw new Error("Fee not found");

  // teacher permission
  if (actor.role === "teacher") {
    await ensureTeacherPermissionForClass(actor._id, fee.classId);
  }

  if (fee.paidAmount + payment.amount > fee.totalAmount)
    throw new Error("Payment exceeds total amount");

  const paymentObj = {
    date: payment.date ? new Date(payment.date) : new Date(),
    amount: Number(payment.amount),
    method: (payment.method || "cash").toLowerCase(),
    reference: payment.reference || null,
    createdBy: actor._id,
  };

  fee.payments.push(paymentObj);
  fee.recalculate();
  await fee.save();

  const pushed = fee.payments[fee.payments.length - 1];

  // receipt
  if (ENABLE_RECEIPT) {
    try {
      const student = await User.findById(fee.studentId).lean();
      const url = await generateReceiptPdf(fee, pushed, student);

      pushed.receiptUrl = url;
      await fee.save();

      if (student?.email)
        sendReceiptEmail(
          student.email,
          "Payment Receipt",
          `Payment of ${pushed.amount} received.`,
          url
        );
    } catch (err) {
      console.error("Receipt error:", err);
    }
  }

  return pushed;
};

/* ---------------------- DELETE (soft) ---------------------- */
export const deleteFeeRecordById = async (id) => {
  const fee = await Fee.findById(id);
  if (!fee) throw new Error("Fee record not found");

  await fee.softDelete();
  return true;
};

/* ---------------------- BULK DELETE ---------------------- */
export const bulkDeleteFeeRecordsByIds = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("IDs required");

  return Fee.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};
