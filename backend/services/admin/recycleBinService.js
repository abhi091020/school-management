// backend/services/admin/recycleBinService.js
// FINAL FIX: Only show profiles, never user records

import mongoose from "mongoose";
import { throwError } from "../../utils/response.js";
import logger from "../../utils/logger.js";

/* MODELS */
import RecycleHistory from "../../models/admin/RecycleHistory.js";
import User from "../../models/admin/User.js";
import Student from "../../models/admin/Student.js";
import Parent from "../../models/admin/Parent.js";
import Teacher from "../../models/admin/EmployeeProfile.js";
import Class from "../../models/admin/Class.js";
import Subject from "../../models/admin/Subject.js";
import Attendance from "../../models/admin/Attendance.js";
import Exam from "../../models/admin/Exam.js";
import Mark from "../../models/admin/Mark.js";
import Timetable from "../../models/admin/Timetable.js";
import Fee from "../../models/admin/Fee.js";
import Notification from "../../models/admin/Notification.js";
import Feedback from "../../models/admin/Feedback.js";

/* UTIL */
import { logRecycleEvent } from "../../utils/recycleLogger.js";
import { normalizeSnapshot } from "../../utils/recycleUtils.js";

/* USER RESTORE CASCADE */
import { restoreUserCascade } from "./userService.js";

/* MODEL MAP - PROFILES ONLY */
const MODEL_MAP = {
  admin: User,
  student: Student,
  parent: Parent,
  teacher: Teacher,
  class: Class,
  subject: Subject,
  attendance: Attendance,
  exam: Exam,
  mark: Mark,
  timetable: Timetable,
  fee: Fee,
  notification: Notification,
  feedback: Feedback,
};

const resolveModel = (type) => {
  const model = MODEL_MAP[type];
  if (!model) throwError(`Unsupported type: ${type}`, 400);
  return model;
};

const isObjectId = (val) => {
  try {
    return mongoose.Types.ObjectId.isValid(String(val));
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/* ENRICH SNAPSHOT                                                             */
/* -------------------------------------------------------------------------- */
const enrichSnapshot = async (doc = {}, type) => {
  const enriched = { ...doc };

  try {
    /* Student → add parent info */
    if (type === "student" && doc.parent) {
      if (isObjectId(doc.parent)) {
        const parentProfile = await Parent.findById(doc.parent)
          .setOptions({ includeDeleted: true })
          .lean();
        if (parentProfile) {
          enriched.parentUserId = parentProfile.userId || null;
          enriched.fatherName = parentProfile.fatherName || null;
          enriched.motherName = parentProfile.motherName || null;
        }
      }
    }

    /* Parent → add children info (FIXED LOGIC) */
    if (type === "parent") {
      // Ensure doc.children is treated as an array, even if null/None
      const children = Array.isArray(doc.children) ? doc.children : [];

      if (children.length) {
        const childrenIds = children.filter((c) => isObjectId(c));

        if (childrenIds.length) {
          // 1. Find Student profiles (deleted or not)
          const students = await Student.find({ _id: { $in: childrenIds } })
            .setOptions({ includeDeleted: true })
            .select("userId admissionNumber")
            .lean();

          const userIds = students.map((s) => s.userId).filter(Boolean);

          let nameMap = {};

          // 2. Find User records (deleted or not) to get the name
          if (userIds.length) {
            const users = await User.find({ userId: { $in: userIds } })
              .setOptions({ includeDeleted: true })
              .select("userId name")
              .lean();

            users.forEach((u) => (nameMap[u.userId] = u.name));
          }

          // 3. Build the final enriched children details
          enriched.childrenDetails = students.map((s) => ({
            id: String(s._id),
            // Use name from User model, fallback to admission number
            name: nameMap[s.userId] || s.admissionNumber || "Unknown Student",
            admissionNumber: s.admissionNumber || "-",
            userId: s.userId || "-",
          }));

          enriched.childrenCount = enriched.childrenDetails.length;
        } else {
          // If children exists but none are valid ObjectIds
          enriched.childrenDetails = [];
          enriched.childrenCount = 0;
        }
      } else {
        // If children array is empty or was 'None'
        enriched.childrenDetails = [];
        enriched.childrenCount = 0;
      }
    }
  } catch (err) {
    logger.error("recycleBin.enrichSnapshot failed", {
      err,
      type,
      id: doc._id || doc.id,
    });
  }

  return enriched;
};

const buildSearchRegex = (search) => {
  if (!search?.trim()) return null;
  return new RegExp(search.trim(), "i");
};

/* -------------------------------------------------------------------------- */
/* LIST DELETED ITEMS                                                         */
/* -------------------------------------------------------------------------- */
export const listDeletedItems = async ({
  type = "user",
  page = 1,
  limit = 20,
  search = "",
  fromDate,
  toDate,
  sortBy = "deletedAt_desc",
} = {}) => {
  page = Math.max(1, Number(page));
  limit = Math.max(1, Number(limit));
  const skip = (page - 1) * limit;

  const typeBuckets = {
    user: ["student", "parent", "teacher"],
    admin: ["admin"],
    student: ["student"],
    parent: ["parent"],
    teacher: ["teacher"],
  };

  const allowedTypes = typeBuckets[type] || [type];
  const searchRegex = buildSearchRegex(search);

  const modelItems = [];

  for (const t of allowedTypes) {
    const Model = MODEL_MAP[t];
    if (!Model) continue;

    const query = { isDeleted: true };

    if (t === "admin") query.role = "admin";

    if (searchRegex) {
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { userId: searchRegex },
        { admissionNumber: searchRegex },
        { fatherName: searchRegex },
        { motherName: searchRegex },
        { employeeId: searchRegex },
        { title: searchRegex },
      ];
    }

    if (fromDate || toDate) {
      query.deletedAt = {};
      if (fromDate) query.deletedAt.$gte = new Date(fromDate);
      if (toDate) query.deletedAt.$lte = new Date(toDate);
    }

    const docs = await Model.find(query)
      .setOptions({ includeDeleted: true })
      .lean();

    for (const doc of docs) {
      /* PHASE 1: enrich */
      let enrichedSnap = await enrichSnapshot(doc, t);

      /* PHASE 2: normalize (CRITICAL FIX) */
      enrichedSnap = await normalizeSnapshot(enrichedSnap);

      /* PHASE 3: inject name/email from user model */
      let userName = enrichedSnap.name || enrichedSnap.fatherName || "-";
      let userEmail = enrichedSnap.email || "-";

      if (t !== "admin" && enrichedSnap.userId) {
        const userDoc = await User.findOne({ userId: enrichedSnap.userId })
          .setOptions({ includeDeleted: true })
          .select("name email")
          .lean();

        if (userDoc) {
          userName = userDoc.name || userName;
          userEmail = userDoc.email || userEmail;
        }
      }

      modelItems.push({
        _id: doc._id,
        origin: "model",
        itemId: String(doc._id),
        type: t,
        deletedAt: doc.deletedAt || null,
        deletedBy: {},
        name: userName,
        userId: enrichedSnap.userId || "-",
        email: userEmail,
        role: t,
        admissionNumber: enrichedSnap.admissionNumber || "-",
        snapshot: enrichedSnap,
      });
    }
  }

  /* Load deletedBy info */
  const historyQuery = {
    type: { $in: allowedTypes },
    action: "deleted",
    isActive: true,
  };

  if (searchRegex) {
    historyQuery.$or = [
      { "snapshot.name": searchRegex },
      { "snapshot.email": searchRegex },
      { "snapshot.userId": searchRegex },
      { "performedBySnapshot.name": searchRegex },
    ];
  }

  if (fromDate || toDate) {
    historyQuery.deletedAt = {};
    if (fromDate) historyQuery.deletedAt.$gte = new Date(fromDate);
    if (toDate) historyQuery.deletedAt.$lte = new Date(toDate);
  }

  const historyLogs = await RecycleHistory.find(historyQuery).lean();

  const map = new Map();
  for (const item of modelItems) map.set(item.itemId, item);

  for (const log of historyLogs) {
    const key = String(log.itemId);
    const existing = map.get(key);

    const performedBySnapshot = log.performedBySnapshot || {
      name: "Unknown",
      email: "-",
      role: "-",
    };

    if (existing) {
      existing.deletedBy = performedBySnapshot;
      existing.deletedAt = log.deletedAt || existing.deletedAt;
      existing.recycleHistoryId = log._id;
    }
  }

  const merged = Array.from(map.values());

  merged.sort((a, b) => {
    const A = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const B = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return sortBy === "deletedAt_asc" ? A - B : B - A;
  });

  const total = merged.length;
  const paginated = merged.slice(skip, skip + limit);

  return {
    items: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* -------------------------------------------------------------------------- */
/* RESTORE ITEMS (ENHANCED ERROR LOGGING)                                       */
/* -------------------------------------------------------------------------- */
export const restoreItems = async (type, ids = [], actor = null) => {
  if (!Array.isArray(ids) || !ids.length) return 0;

  const actorId = actor?._id || null;
  let restored = 0;

  for (const rawId of ids) {
    const id = String(rawId);
    if (!isObjectId(id)) continue;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let actualType = null;
      let doc = null;

      doc = await Student.findOne({ _id: id, isDeleted: true })
        .setOptions({ includeDeleted: true })
        .session(session)
        .lean();
      if (doc) actualType = "student";

      if (!actualType) {
        doc = await Parent.findOne({ _id: id, isDeleted: true })
          .setOptions({ includeDeleted: true })
          .session(session)
          .lean();
        if (doc) actualType = "parent";
      }

      if (!actualType) {
        doc = await Teacher.findOne({ _id: id, isDeleted: true })
          .setOptions({ includeDeleted: true })
          .session(session)
          .lean();
        if (doc) actualType = "teacher";
      }

      if (!actualType) {
        doc = await User.findOne({
          _id: id,
          isDeleted: true,
          role: "admin",
        })
          .setOptions({ includeDeleted: true })
          .session(session)
          .lean();
        if (doc) actualType = "admin";
      }

      if (!actualType) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      if (["student", "parent", "teacher"].includes(actualType)) {
        await restoreUserCascade(id, actorId, session);
      } else if (actualType === "admin") {
        await User.updateOne(
          { _id: id },
          {
            $set: {
              isDeleted: false,
              deletedAt: null,
              status: "active",
              updatedAt: new Date(),
            },
          },
          { session }
        );
      } else {
        const Model = resolveModel(actualType);
        await Model.updateOne(
          { _id: id },
          {
            $set: { isDeleted: false, deletedAt: null, updatedAt: new Date() },
          },
          { session }
        );
      }

      await RecycleHistory.updateMany(
        { itemId: id, action: "deleted", isActive: true },
        { $set: { isActive: false } },
        { session }
      );

      await session.commitTransaction();
      restored++;
    } catch (err) {
      await session.abortTransaction();
      // ENHANCED LOGGING HERE: Logs the actual error message
      logger.error("restoreItems: transaction failed", {
        err: err.message || err.toString(), // Capture the specific error details
        id,
      });
    } finally {
      session.endSession();
    }
  }

  return restored;
};

/* -------------------------------------------------------------------------- */
/* HARD DELETE ITEMS                                                           */
/* -------------------------------------------------------------------------- */
export const hardDeleteItems = async (type, ids = [], actor = null) => {
  if (!Array.isArray(ids) || !ids.length) return 0;

  let removed = 0;

  for (const rawId of ids) {
    const id = String(rawId);
    if (!isObjectId(id)) continue;

    let doc = null;
    let actualType = null;

    doc = await Student.findOne({ _id: id, isDeleted: true })
      .setOptions({ includeDeleted: true })
      .lean();
    if (doc) actualType = "student";

    if (!actualType) {
      doc = await Parent.findOne({ _id: id, isDeleted: true })
        .setOptions({ includeDeleted: true })
        .lean();
      if (doc) actualType = "parent";
    }

    if (!actualType) {
      doc = await Teacher.findOne({ _id: id, isDeleted: true })
        .setOptions({ includeDeleted: true })
        .lean();
      if (doc) actualType = "teacher";
    }

    if (!actualType) {
      doc = await User.findOne({ _id: id, isDeleted: true, role: "admin" })
        .setOptions({ includeDeleted: true })
        .lean();
      if (doc) actualType = "admin";
    }

    if (!actualType) continue;

    const Model = MODEL_MAP[actualType];
    if (Model) {
      await Model.deleteOne({ _id: id });

      if (["student", "parent", "teacher"].includes(actualType) && doc.userId) {
        await User.deleteOne({ userId: doc.userId });
      }

      await RecycleHistory.updateMany(
        { itemId: id, action: "deleted", isActive: true },
        { $set: { isActive: false } }
      );

      try {
        await logRecycleEvent({
          itemId: id,
          type: actualType,
          action: "permanently_deleted",
          performedBy: actor,
          snapshot: null,
        });
      } catch (e) {}

      removed++;
    }
  }

  return removed;
};

export default {
  listDeletedItems,
  restoreItems,
  hardDeleteItems,
};
