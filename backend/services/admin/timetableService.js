// services/admin/timetableService.js

import mongoose from "mongoose";
import Timetable from "../../models/admin/Timetable.js";
import Class from "../../models/admin/Class.js";
import Subject from "../../models/admin/Subject.js";
import User from "../../models/admin/User.js";
import { throwError } from "../../utils/response.js";

const safeNum = (n, fb = 1, max = 200) => {
  const x = parseInt(n, 10);
  return isNaN(x) || x < 1 ? fb : Math.min(x, max);
};

const isValidId = (id) => mongoose.isValidObjectId(id);

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm)
    .split(":")
    .map((v) => parseInt(v, 10));
  return h * 60 + m;
};

const rangesOverlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

/* ------------------------------------------------------------
   Validate class, subject, teacher relationships
------------------------------------------------------------ */
const validateReferencesAndRelations = async (
  classId,
  subjectId,
  teacherId
) => {
  if (!isValidId(classId)) throwError("Invalid classId", 400);
  if (!isValidId(subjectId)) throwError("Invalid subjectId", 400);
  if (!isValidId(teacherId)) throwError("Invalid teacherId", 400);

  const [classDoc, subject, teacher] = await Promise.all([
    Class.findOne({ _id: classId, isDeleted: false, status: "active" }).select(
      "name"
    ),
    Subject.findOne({ _id: subjectId, isDeleted: false }).select(
      "classes teachers"
    ),
    User.findOne({
      _id: teacherId,
      role: "teacher",
      isDeleted: false,
      status: "active",
    }).select("assignedClasses assignedSubjects"),
  ]);

  if (!classDoc) throwError("Class not found or inactive", 404);
  if (!subject) throwError("Subject not found", 404);
  if (!teacher) throwError("Teacher not found or inactive", 404);

  // Subject must include class
  if (!subject.classes.map(String).includes(classId.toString())) {
    throwError("Subject is not assigned to this class", 400);
  }

  // Subject must include teacher (if tracked)
  if (subject.teachers?.length > 0) {
    if (!subject.teachers.map(String).includes(teacherId.toString())) {
      throwError("Teacher is not assigned to this subject", 400);
    }
  }

  // Teacher must be assigned to the class
  if (
    teacher.assignedClasses?.length > 0 &&
    !teacher.assignedClasses.map(String).includes(classId.toString())
  ) {
    throwError("Teacher is not assigned to this class", 400);
  }

  return { classDoc, subject, teacher };
};

/* ------------------------------------------------------------
   Conflict detection
------------------------------------------------------------ */
const findConflict = async (
  day,
  classId,
  teacherId,
  startTime,
  endTime,
  ignoreId = null
) => {
  const q = {
    day,
    isDeleted: false,
    $or: [{ classId }, { teacherId }],
  };

  if (ignoreId && isValidId(ignoreId)) q._id = { $ne: ignoreId };

  const entries = await Timetable.find(q).lean();

  const s1 = toMinutes(startTime);
  const e1 = toMinutes(endTime);

  for (const slot of entries) {
    const s2 = toMinutes(slot.startTime);
    const e2 = toMinutes(slot.endTime);

    if (rangesOverlap(s1, e1, s2, e2)) {
      return {
        conflictWith: slot,
        type:
          slot.classId.toString() === classId.toString()
            ? "class"
            : slot.teacherId.toString() === teacherId.toString()
            ? "teacher"
            : "unknown",
      };
    }
  }

  return null;
};

/* ------------------------------------------------------------
   GET ALL
------------------------------------------------------------ */
export const getAllTimetables = async (
  filters = {},
  page = 1,
  limit = 50,
  user = null
) => {
  const safePage = safeNum(page, 1);
  const safeLimit = safeNum(limit, 50);
  const skip = (safePage - 1) * safeLimit;

  const q = { isDeleted: false };

  if (filters.classId && isValidId(filters.classId))
    q.classId = filters.classId;
  if (filters.teacherId && isValidId(filters.teacherId))
    q.teacherId = filters.teacherId;
  if (filters.subjectId && isValidId(filters.subjectId))
    q.subjectId = filters.subjectId;
  if (filters.day) q.day = filters.day;

  // Student/Parent restricted to own class
  if (user && ["student", "parent"].includes(user.role)) {
    if (!user.classId) {
      return {
        timetables: [],
        total: 0,
        page: safePage,
        limit: safeLimit,
        totalPages: 0,
      };
    }
    q.classId = user.classId;
  }

  const [timetables, total] = await Promise.all([
    Timetable.find(q)
      .populate([
        { path: "classId", select: "name section classTeacher" },
        { path: "subjectId", select: "name code teachers" },
        { path: "teacherId", select: "name email role" },
      ])
      .sort({ day: 1, startTime: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    Timetable.countDocuments(q),
  ]);

  return {
    timetables,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/* ------------------------------------------------------------
   GET BY ID
------------------------------------------------------------ */
export const getTimetableById = async (id, user = null) => {
  if (!isValidId(id)) throwError("Invalid ID", 400);

  const entry = await Timetable.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate([
      { path: "classId", select: "name section classTeacher" },
      { path: "subjectId", select: "name code teachers" },
      { path: "teacherId", select: "name email role" },
    ])
    .lean();

  if (!entry) return null;

  if (user && ["student", "parent"].includes(user.role)) {
    if (
      !user.classId ||
      user.classId.toString() !== entry.classId._id.toString()
    )
      return null;
  }

  return entry;
};

/* ------------------------------------------------------------
   CREATE TIMETABLE
------------------------------------------------------------ */
export const createTimetable = async (data, actor) => {
  if (!data.startTime || !data.endTime)
    throwError("startTime and endTime required", 400);

  const s = toMinutes(data.startTime);
  const e = toMinutes(data.endTime);
  if (e <= s) throwError("endTime must be greater than startTime", 400);

  await validateReferencesAndRelations(
    data.classId,
    data.subjectId,
    data.teacherId
  );

  // Teacher can only create for themselves
  if (actor?.role === "teacher") {
    if (actor._id.toString() !== data.teacherId.toString()) {
      throwError("Teachers can only create their own slots", 403);
    }
  }

  const conflict = await findConflict(
    data.day,
    data.classId,
    data.teacherId,
    data.startTime,
    data.endTime
  );
  if (conflict) {
    throwError(
      `Time conflict (${conflict.type}) with ${conflict.conflictWith._id}`,
      409
    );
  }

  const entry = await Timetable.create(data);

  return await Timetable.findById(entry._id).populate([
    { path: "classId", select: "name section classTeacher" },
    { path: "subjectId", select: "name code teachers" },
    { path: "teacherId", select: "name email role" },
  ]);
};

/* ------------------------------------------------------------
   UPDATE
------------------------------------------------------------ */
export const updateTimetableById = async (id, updates, actor) => {
  if (!isValidId(id)) throwError("Invalid ID", 400);

  const existing = await Timetable.findById(id).lean();
  if (!existing || existing.isDeleted)
    throwError("Timetable entry not found", 404);

  const classId = updates.classId || existing.classId;
  const subjectId = updates.subjectId || existing.subjectId;
  const teacherId = updates.teacherId || existing.teacherId;
  const day = updates.day || existing.day;
  const start = updates.startTime || existing.startTime;
  const end = updates.endTime || existing.endTime;

  const s = toMinutes(start);
  const e = toMinutes(end);
  if (e <= s) throwError("endTime must be greater than startTime", 400);

  await validateReferencesAndRelations(classId, subjectId, teacherId);

  if (actor?.role === "teacher") {
    if (actor._id.toString() !== teacherId.toString()) {
      throwError("Teachers can only update their own timetable entries", 403);
    }
  }

  const conflict = await findConflict(day, classId, teacherId, start, end, id);
  if (conflict) {
    throwError(
      `Time conflict (${conflict.type}) with ${conflict.conflictWith._id}`,
      409
    );
  }

  return await Timetable.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: "classId", select: "name section classTeacher" },
    { path: "subjectId", select: "name code teachers" },
    { path: "teacherId", select: "name email role" },
  ]);
};

/* ------------------------------------------------------------
   DELETE
------------------------------------------------------------ */
export const deleteTimetableById = async (id, actor) => {
  if (!isValidId(id)) throwError("Invalid ID", 400);

  const entry = await Timetable.findOne({ _id: id }).setOptions({
    includeDeleted: true,
  });

  if (!entry || entry.isDeleted) throwError("Timetable entry not found", 404);

  if (actor?.role === "teacher") {
    if (entry.teacherId.toString() !== actor._id.toString()) {
      throwError("Teachers can delete only their own entries", 403);
    }
  }

  return entry.softDelete();
};

/* ------------------------------------------------------------
   BULK DELETE (admin only)
------------------------------------------------------------ */
export const bulkDeleteTimetables = async (ids, actor) => {
  if (!Array.isArray(ids) || ids.length === 0)
    throwError("IDs must be array", 400);

  if (actor?.role !== "admin") throwError("Only admin allowed", 403);

  return Timetable.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};

export default {
  getAllTimetables,
  getTimetableById,
  createTimetable,
  updateTimetableById,
  deleteTimetableById,
  bulkDeleteTimetables,
};
