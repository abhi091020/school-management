// services/admin/eventService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";

import Event from "../../models/admin/Event.js";
import User from "../../models/admin/User.js";

/* ============================================================
   HELPERS
============================================================ */
const safeNumber = (num, fallback, max = 200) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const normalizeIncludeDeleted = (raw) =>
  raw === true || raw === "true" || raw === "1";

const validateDates = (start, end) => {
  if (start && end && new Date(end) < new Date(start)) {
    throw new Error("End date cannot be before start date");
  }
};

const ensureValidId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${label}`);
  }
};

/* ============================================================
   CREATE EVENT
   - Used by Admin controller: createEvent(req.body, req.userId)
============================================================ */
export const createEvent = async (data, userId) => {
  const creatorId = data.createdBy || userId;
  if (!creatorId) throw new Error("Event creator is required");

  validateDates(data.startDate, data.endDate);

  const user = await User.findOne({
    _id: creatorId,
    isDeleted: false,
    status: "active",
  }).lean();

  if (!user) throw new Error("Invalid creator user");

  const payload = {
    ...data,
    createdBy: creatorId,
  };

  return Event.create(payload);
};

/* ============================================================
   GET ALL EVENTS
   - Supports includeDeleted
   - Compatible with: getAllEvents({ ...filters, ...req.query })
============================================================ */
export const getAllEvents = async (options = {}) => {
  const page = safeNumber(options.page, 1, 200);
  const limit = safeNumber(options.limit, 50, 200);
  const search = options.search || "";
  const includeDeleted = normalizeIncludeDeleted(options.includeDeleted);

  const filter = {};

  // Soft delete behavior
  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  // Optional filters
  if (options.createdBy && mongoose.isValidObjectId(options.createdBy)) {
    filter.createdBy = options.createdBy;
  }

  if (typeof options.isActive !== "undefined") {
    const activeFlag =
      options.isActive === true ||
      options.isActive === "true" ||
      options.isActive === "1";
    filter.isActive = activeFlag;
  }

  if (options.audience) {
    const aud =
      Array.isArray(options.audience) && options.audience.length
        ? options.audience
        : [options.audience];
    filter.audience = { $in: aud.map(String) };
  }

  if (search) {
    const escaped = escapeStringRegexp(String(search));
    const regex = new RegExp(escaped, "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }

  // Date range filters (optional)
  if (options.fromDate || options.toDate) {
    const range = {};
    if (options.fromDate) range.$gte = new Date(options.fromDate);
    if (options.toDate) range.$lte = new Date(options.toDate);
    filter.startDate = range;
  }

  const skip = (page - 1) * limit;

  const events = await Event.find({
    ...filter,
    includeDeleted, // for pre(/^find/) hook
  })
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // countDocuments is NOT affected by pre hooks, so handle isDeleted manually
  const countFilter = { ...filter };
  const total = await Event.countDocuments(countFilter);

  return {
    events,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/* ============================================================
   GET EVENT BY ID
   - Supports includeDeleted
   - Compatible with: getEventById(id, filters)
============================================================ */
export const getEventById = async (id, filters = {}) => {
  ensureValidId(id, "event ID");

  const includeDeleted = normalizeIncludeDeleted(filters.includeDeleted);

  const query = {
    _id: id,
    includeDeleted, // used by schema pre(/^find/)
  };

  return Event.findOne(query).lean();
};

/* ============================================================
   UPDATE EVENT BY ID
   - Compatible with: updateEventById(id, updates, userId)
============================================================ */
export const updateEventById = async (id, updates, userId) => {
  ensureValidId(id, "event ID");

  if (updates.startDate || updates.endDate) {
    validateDates(updates.startDate, updates.endDate);
  }

  // creator cannot be changed
  delete updates.createdBy;

  const event = await Event.findById(id);
  if (!event || event.isDeleted) {
    throw new Error("Event not found");
  }

  const user = await User.findById(userId).lean();
  if (!user || user.isDeleted || user.status !== "active") {
    throw new Error("Invalid user");
  }

  const role = String(user.role).toLowerCase();

  // Teachers can only edit their own events; admins/super_admins can edit all
  if (
    role === "teacher" &&
    event.createdBy.toString() !== user._id.toString()
  ) {
    throw new Error("You are not authorized to edit this event");
  }

  const updated = await Event.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  ).lean();

  return updated;
};

/* ============================================================
   DELETE EVENT (SOFT DELETE)
   - Compatible with: deleteEventById(id)
   - If you want to enforce user-based delete, add userId param
============================================================ */
export const deleteEventById = async (id, userId = null) => {
  ensureValidId(id, "event ID");

  const event = await Event.findById(id);
  if (!event || event.isDeleted) {
    throw new Error("Event not found");
  }

  if (userId) {
    const user = await User.findById(userId).lean();
    if (!user || user.isDeleted || user.status !== "active") {
      throw new Error("Invalid user");
    }

    const role = String(user.role).toLowerCase();

    // Teachers can only delete their own events
    if (
      role === "teacher" &&
      event.createdBy.toString() !== user._id.toString()
    ) {
      throw new Error("You are not authorized to delete this event");
    }
  }

  await event.softDelete();
  return true;
};
