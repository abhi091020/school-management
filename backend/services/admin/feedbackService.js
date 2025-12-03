// services/admin/feedbackService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";
import Feedback from "../../models/admin/Feedback.js";

/* ============================================================
   HELPERS
============================================================ */
const safeNumber = (num, fallback = 1, max = 200) => {
  const n = parseInt(num);
  if (isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const normalizeIncludeDeleted = (v) => v === true || v === "true" || v === "1";

const ensureValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid feedback ID");
};

/* ============================================================
   CREATE FEEDBACK
============================================================ */
export const createFeedback = async (data, userId) => {
  data.sender = userId; // enforce sender
  const created = await Feedback.create(data);
  return created.toObject();
};

/* ============================================================
   GET ALL FEEDBACKS — Supports includeDeleted
============================================================ */
export const getAllFeedbacks = async (query = {}) => {
  const {
    page = 1,
    limit = 50,
    search,
    status,
    sender,
    recipient,
    includeDeleted,
  } = query;

  const safePage = safeNumber(page, 1);
  const safeLimit = safeNumber(limit, 50);
  const skip = (safePage - 1) * safeLimit;

  const filter = {};

  // includeDeleted logic
  const allowDeleted = normalizeIncludeDeleted(includeDeleted);
  if (!allowDeleted) filter.isDeleted = false;

  // Text search
  if (search) {
    const escaped = escapeStringRegexp(search);
    filter.$or = [
      { subject: new RegExp(escaped, "i") },
      { message: new RegExp(escaped, "i") },
    ];
  }

  // Filters
  if (status) filter.status = status.toLowerCase();
  if (sender) filter.sender = sender;
  if (recipient) filter.recipient = recipient;

  const feedbacks = await Feedback.find(filter)
    .populate("sender recipient", "name email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const total = await Feedback.countDocuments(filter);

  return {
    feedbacks,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/* ============================================================
   GET ONE FEEDBACK — Supports includeDeleted
============================================================ */
export const getFeedbackById = async (id, query = {}) => {
  ensureValidId(id);

  const includeDeleted = normalizeIncludeDeleted(query.includeDeleted);

  const filter = { _id: id };
  if (!includeDeleted) filter.isDeleted = false;

  return Feedback.findOne(filter)
    .populate("sender recipient", "name email role")
    .lean();
};

/* ============================================================
   UPDATE FEEDBACK
   (Status, replies, etc.)
============================================================ */
export const updateFeedbackById = async (id, updates, userId) => {
  ensureValidId(id);

  const feedback = await Feedback.findOne({ _id: id, isDeleted: false });
  if (!feedback) throw new Error("Feedback not found");

  // Only admin, teacher OR sender can update
  const isSender = feedback.sender.toString() === userId.toString();
  const isRecipient = feedback.recipient?.toString() === userId.toString();

  if (!isSender && !isRecipient) {
    // Admin permission should be handled in middleware
    throw new Error("You are not authorized to update this feedback");
  }

  if (updates.status) updates.status = updates.status.toLowerCase();

  return Feedback.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("sender recipient", "name email role")
    .lean();
};

/* ============================================================
   UPDATE STATUS (used by dedicated controller endpoint)
============================================================ */
export const updateFeedbackStatus = async (id, update, userId) => {
  ensureValidId(id);

  const feedback = await Feedback.findOne({ _id: id, isDeleted: false });
  if (!feedback) throw new Error("Feedback not found");

  const isRecipient = feedback.recipient?.toString() === userId.toString();
  const isSender = feedback.sender.toString() === userId.toString();

  if (!isRecipient && !isSender) {
    throw new Error("You are not authorized to update this feedback");
  }

  const updates = {};
  if (update.status) updates.status = update.status.toLowerCase();
  if (update.reply) updates.reply = update.reply;

  return Feedback.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("sender recipient", "name email role")
    .lean();
};

/* ============================================================
   DELETE (SOFT DELETE)
============================================================ */
export const deleteFeedbackById = async (id, userId, userRole) => {
  ensureValidId(id);

  const feedback = await Feedback.findById(id);
  if (!feedback || feedback.isDeleted) throw new Error("Feedback not found");

  const isSender = feedback.sender.toString() === userId.toString();
  const isRecipient =
    feedback.recipient && feedback.recipient.toString() === userId.toString();

  if (userRole === "teacher" && !isSender && !isRecipient) {
    throw new Error("You are not authorized to delete this feedback");
  }

  await feedback.softDelete();
  return true;
};

/* ============================================================
   BULK DELETE
============================================================ */
export const bulkDeleteFeedbacks = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0)
    throw new Error("IDs array is required");

  return Feedback.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};
