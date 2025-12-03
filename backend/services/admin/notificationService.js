// services/admin/notificationService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";

import Notification from "../../models/admin/Notification.js";
import User from "../../models/admin/User.js";
import Class from "../../models/admin/Class.js";

/* ---------------------------------------------
   HELPERS
---------------------------------------------- */
const safeNum = (n, fb = 1, max = 200) => {
  const x = parseInt(n, 10);
  if (isNaN(x) || x < 1) return fb;
  return Math.min(x, max);
};

const isValidId = (id) => mongoose.isValidObjectId(id);

const normalizeIncludeDeleted = (v) => v === true || v === "true" || v === "1";

/* Validate referenced IDs */
const validateIdsExist = async (Model, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const valid = ids.filter(isValidId);
  if (valid.length !== ids.length)
    throw new Error("One or more IDs are invalid");

  const docs = await Model.find({ _id: { $in: valid }, isDeleted: false })
    .select("_id")
    .lean();

  if (docs.length !== valid.length)
    throw new Error("One or more referenced resources not found or inactive");

  return valid;
};

/* Teacher permission helpers */
const ensureTeacherCanTarget = async (actorId, payload) => {
  const teacher = await User.findById(actorId).lean();
  if (!teacher || teacher.role !== "teacher")
    throw new Error("Teacher not found or unauthorized");

  const assignedClasses = (teacher.assignedClasses || []).map(String);

  const {
    targetType,
    targetClasses = [],
    targetUsers = [],
    targetRoles = [],
    type,
  } = payload;

  if (targetType === "all")
    throw new Error("Teachers cannot create global notifications");
  if (targetType === "role" || (targetRoles && targetRoles.length > 0))
    throw new Error("Teachers cannot target by role");

  if (type === "fee")
    throw new Error("Teachers are not allowed to send fee notifications");

  if (targetType === "class") {
    if (!Array.isArray(targetClasses) || targetClasses.length === 0)
      throw new Error("targetClasses required");
    for (const cid of targetClasses) {
      if (!isValidId(cid)) throw new Error("Invalid class id");
      if (!assignedClasses.includes(cid.toString()))
        throw new Error(`Not authorized for class ${cid}`);
    }
  }

  if (targetType === "user") {
    if (!Array.isArray(targetUsers) || targetUsers.length === 0)
      throw new Error("targetUsers required");

    const users = await User.find({
      _id: { $in: targetUsers },
      isDeleted: false,
      status: "active",
    })
      .select("role classId")
      .lean();

    if (users.length !== targetUsers.length)
      throw new Error("One or more target users not found");

    for (const u of users) {
      if (u.role !== "student")
        throw new Error("Teachers can only target student users");
      if (!u.classId) throw new Error("Target student has no class assigned");
      if (!assignedClasses.includes(u.classId.toString()))
        throw new Error("One or more students are not in your classes");
    }
  }

  if (payload.targetRoles?.includes("parent"))
    throw new Error("Teachers cannot target parents");

  return true;
};

/* Build visibility query */
const buildVisibilityQueryForUser = (user) => {
  const or = [];

  or.push({ targetType: "all" });
  or.push({ targetType: "user", targetUsers: user._id });
  or.push({ targetType: "role", targetRoles: user.role });

  if (user.classId)
    or.push({ targetType: "class", targetClasses: user.classId });

  return { $or: or };
};

/* ---------------------------------------------
   CREATE
---------------------------------------------- */
export const createNotification = async (data, actor) => {
  if (!actor || !actor._id) throw new Error("Actor required");

  if (data.targetUsers) await validateIdsExist(User, data.targetUsers);
  if (data.targetClasses) await validateIdsExist(Class, data.targetClasses);

  if (actor.role === "teacher") {
    await ensureTeacherCanTarget(actor._id, data);
  }

  const notif = await Notification.create({
    ...data,
    createdBy: actor._id,
  });

  return notif;
};

/* ---------------------------------------------
   GET NOTIFICATIONS FOR USER
   WITH includeDeleted support
---------------------------------------------- */
export const getNotificationsForUser = async (user, query = {}) => {
  const page = safeNum(query.page, 1);
  const limit = safeNum(query.limit, 50);
  const skip = (page - 1) * limit;

  const includeDeleted = normalizeIncludeDeleted(query.includeDeleted);
  delete query.includeDeleted;

  const base = {};

  // Include or exclude deleted
  if (!includeDeleted) base.isDeleted = false;

  if (query.type) base.type = query.type;

  const visibility = buildVisibilityQueryForUser(user);

  let textFilter = {};
  if (query.search) {
    const escaped = escapeStringRegexp(String(query.search));
    textFilter = { $text: { $search: escaped } };
  }

  const finalQuery = { $and: [base, visibility] };
  if (query.search) finalQuery.$and.push(textFilter);

  // unread filter
  if (query.unread === "true") {
    finalQuery.$and.push({ "readBy.userId": { $ne: user._id } });
  }

  const total = await Notification.countDocuments({ $and: finalQuery.$and });

  const notifications = await Notification.find({ $and: finalQuery.$and })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/* ---------------------------------------------
   GET ONE (with includeDeleted)
---------------------------------------------- */
export const getNotificationById = async (id, user, query = {}) => {
  if (!isValidId(id)) throw new Error("Invalid ID");

  const includeDeleted = normalizeIncludeDeleted(query.includeDeleted);

  const notif = await Notification.findOne({
    _id: id,
    ...(includeDeleted ? {} : { isDeleted: false }),
  });

  if (!notif) return null;

  // visibility rules
  const isVisible =
    notif.targetType === "all" ||
    (notif.targetType === "user" &&
      notif.targetUsers?.some((u) => u.toString() === user._id.toString())) ||
    (notif.targetType === "role" && notif.targetRoles?.includes(user.role)) ||
    (notif.targetType === "class" &&
      notif.targetClasses?.some(
        (cid) => cid.toString() === (user.classId || "").toString()
      ));

  if (!isVisible) return null;

  return notif;
};

/* ---------------------------------------------
   UPDATE
---------------------------------------------- */
export const updateNotificationById = async (id, updates, actor) => {
  if (!isValidId(id)) throw new Error("Invalid ID");

  const notif = await Notification.findById(id);
  if (!notif || notif.isDeleted) throw new Error("Notification not found");

  if (actor.role === "teacher") {
    if (updates.targetType === "all" || updates.targetType === "role")
      throw new Error("Teachers cannot set global or role-based targets");
    if (updates.type === "fee")
      throw new Error("Teachers cannot set fee notification");

    const combined = { ...notif.toObject(), ...updates };
    await ensureTeacherCanTarget(actor._id, combined);
  }

  if (updates.targetUsers) await validateIdsExist(User, updates.targetUsers);
  if (updates.targetClasses)
    await validateIdsExist(Class, updates.targetClasses);

  const updated = await Notification.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  );

  return updated;
};

/* ---------------------------------------------
   READ
---------------------------------------------- */
export const markNotificationRead = async (id, userId) => {
  if (!isValidId(id)) throw new Error("Invalid ID");

  const notif = await Notification.findById(id);
  if (!notif || notif.isDeleted) throw new Error("Notification not found");

  await notif.markAsRead(userId);
  return notif;
};

/* ---------------------------------------------
   DELETE
---------------------------------------------- */
export const deleteNotificationById = async (id, actor) => {
  if (!isValidId(id)) throw new Error("Invalid ID");

  const notif = await Notification.findById(id);
  if (!notif || notif.isDeleted) throw new Error("Notification not found");

  if (actor.role === "teacher") {
    if (notif.createdBy?.toString() !== actor._id.toString())
      throw new Error("You can only delete notifications you created");

    await ensureTeacherCanTarget(actor._id, notif.toObject());
  }

  await notif.softDelete();
  return true;
};

/* ---------------------------------------------
   BULK DELETE
---------------------------------------------- */
export const bulkDeleteNotifications = async (ids, actor) => {
  if (actor.role !== "admin") throw new Error("Not authorized");
  if (!Array.isArray(ids) || ids.length === 0)
    throw new Error("ids must be an array");

  return Notification.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};
