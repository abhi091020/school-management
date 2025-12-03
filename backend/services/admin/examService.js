// services/admin/examService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";

import Exam from "../../models/admin/Exam.js";
import Class from "../../models/admin/Class.js";
import Subject from "../../models/admin/Subject.js";
import User from "../../models/admin/User.js";

/* ============================================================
   HELPERS
============================================================ */
const safeNumber = (num, fallback, max = 200) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const normalizeIncludeDeleted = (val) =>
  val === true || val === "true" || val === "1";

const normalizeDate = (date) => {
  if (!date) return date;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const ensureValidId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${label}`);
  }
};

const validateClassAndSubject = async (classId, subjectId) => {
  ensureValidId(classId, "classId");
  ensureValidId(subjectId, "subjectId");

  const cls = await Class.findOne({ _id: classId, isDeleted: false }).lean();
  if (!cls) throw new Error("Class not found");

  const subject = await Subject.findOne({ _id: subjectId, isDeleted: false });
  if (!subject) throw new Error("Subject not found");

  if (cls.subjects?.length) {
    if (!cls.subjects.map(String).includes(subjectId.toString())) {
      throw new Error(`Subject ${subject.name} is not assigned to this class`);
    }
  }
};

const validateTeacherPermission = async (teacherId, classId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: "teacher",
    status: "active",
    isDeleted: false,
  }).lean();

  if (!teacher) throw new Error("Invalid teacher");

  const assigned = teacher.assignedClasses?.map(String) || [];
  if (!assigned.includes(String(classId))) {
    throw new Error("You are not assigned to this class");
  }
};

/* ============================================================
   GET ALL EXAMS — Supports includeDeleted
============================================================ */
export const getAllExams = async (filters = {}, page = 1, limit = 50) => {
  const includeDeleted = normalizeIncludeDeleted(filters.includeDeleted);

  const safePage = safeNumber(page, 1);
  const safeLimit = safeNumber(limit, 50);

  const q = {};

  if (!includeDeleted) q.isDeleted = false;

  if (filters.classId) q.classId = filters.classId;
  if (filters.subjectId) q.subjectId = filters.subjectId;
  if (filters.status) q.status = filters.status.toLowerCase();

  if (filters.search) {
    const escaped = escapeStringRegexp(filters.search);
    q.$or = [{ name: new RegExp(escaped, "i") }];
  }

  if (filters.startDate || filters.endDate) {
    q.examDate = {};
    if (filters.startDate) q.examDate.$gte = normalizeDate(filters.startDate);
    if (filters.endDate) q.examDate.$lte = normalizeDate(filters.endDate);
  }

  const skip = (safePage - 1) * safeLimit;

  const exams = await Exam.find({
    ...q,
    includeDeleted, // allows schema pre-find to show deleted
  })
    .populate([
      { path: "classId", select: "name section classTeacher" },
      { path: "subjectId", select: "name code teachers" },
    ])
    .sort({ examDate: 1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const total = await Exam.countDocuments(q);

  return {
    exams,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/* ============================================================
   GET ONE EXAM — Supports includeDeleted
============================================================ */
export const getExamById = async (id, filters = {}) => {
  ensureValidId(id, "exam ID");

  const includeDeleted = normalizeIncludeDeleted(filters.includeDeleted);

  const query = { _id: id };
  if (!includeDeleted) query.isDeleted = false;

  return Exam.findOne(query)
    .populate([
      { path: "classId", select: "name section classTeacher" },
      { path: "subjectId", select: "name code teachers" },
    ])
    .lean();
};

/* ============================================================
   CREATE
============================================================ */
export const createExam = async (data, userId, role) => {
  const { classId, subjectId, examDate } = data;

  if (!classId || !subjectId || !examDate)
    throw new Error("classId, subjectId and examDate are required");

  await validateClassAndSubject(classId, subjectId);

  if (role === "teacher") {
    await validateTeacherPermission(userId, classId);
  }

  try {
    const created = await Exam.create(data);

    return await Exam.findById(created._id)
      .populate(["classId", "subjectId"])
      .lean();
  } catch (err) {
    if (err.code === 11000) {
      throw new Error(
        "Exam already exists for this class & subject on this date"
      );
    }
    throw err;
  }
};

/* ============================================================
   UPDATE
============================================================ */
export const updateExamById = async (id, updates, userId, role) => {
  ensureValidId(id, "exam ID");

  const existing = await Exam.findOne({ _id: id, isDeleted: false });
  if (!existing) throw new Error("Exam not found");

  const newClassId = updates.classId || existing.classId;
  const newSubjectId = updates.subjectId || existing.subjectId;

  if (updates.classId || updates.subjectId) {
    await validateClassAndSubject(newClassId, newSubjectId);
  }

  if (role === "teacher") {
    await validateTeacherPermission(userId, newClassId);
  }

  if (updates.passingMarks && updates.totalMarks) {
    if (updates.passingMarks > updates.totalMarks) {
      throw new Error("Passing marks cannot exceed total marks");
    }
  }

  const examDate = normalizeDate(updates.examDate || existing.examDate);

  const duplicate = await Exam.findOne({
    _id: { $ne: id },
    classId: newClassId,
    subjectId: newSubjectId,
    examDate,
    isDeleted: false,
  });

  if (duplicate)
    throw new Error("Another exam exists with same class/subject/date");

  return Exam.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate([
      { path: "classId", select: "name section classTeacher" },
      { path: "subjectId", select: "name code teachers" },
    ])
    .lean();
};

/* ============================================================
   DELETE (SOFT)
============================================================ */
export const deleteExamById = async (id, userId, role) => {
  ensureValidId(id, "exam ID");

  const exam = await Exam.findById(id);
  if (!exam || exam.isDeleted) throw new Error("Exam not found");

  if (role === "teacher") {
    await validateTeacherPermission(userId, exam.classId);
  }

  await exam.softDelete();
  return true;
};

/* ============================================================
   BULK DELETE (ADMIN ONLY)
============================================================ */
export const bulkDeleteExams = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0)
    throw new Error("No exam IDs provided");

  return Exam.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};
