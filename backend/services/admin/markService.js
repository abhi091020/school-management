// services/admin/markService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";

import Mark from "../../models/admin/Mark.js";
import Exam from "../../models/admin/Exam.js";
import User from "../../models/admin/User.js";

/* -----------------------------
   HELPERS
------------------------------ */
const safeNum = (n, fb = 1, max = 200) => {
  const x = parseInt(n, 10);
  if (isNaN(x) || x <= 0) return fb;
  return Math.min(x, max);
};

const isValidId = (id) => mongoose.isValidObjectId(id);
const normalizeIncludeDeleted = (v) => v === true || v === "true" || v === "1";

/* -----------------------------
   VALIDATION HELPERS
------------------------------ */
const validateMarkInput = async (data) => {
  const { examId, studentId, subjectId, marksObtained, maxMarks } = data;

  if (!isValidId(examId)) throw new Error("Invalid examId");
  if (!isValidId(studentId)) throw new Error("Invalid studentId");
  if (!isValidId(subjectId)) throw new Error("Invalid subjectId");

  const exam = await Exam.findById(examId).lean();
  if (!exam || exam.isDeleted) throw new Error("Invalid exam");

  if (!exam.subjectId || exam.subjectId.toString() !== subjectId.toString()) {
    throw new Error("Subject does not match exam subject");
  }

  const student = await User.findById(studentId).lean();
  if (!student || student.isDeleted || student.role !== "student") {
    throw new Error("Invalid student");
  }

  if (
    !student.classId ||
    student.classId.toString() !== exam.classId.toString()
  ) {
    throw new Error("Student does not belong to the exam class");
  }

  if (marksObtained !== undefined && maxMarks !== undefined) {
    if (marksObtained > maxMarks)
      throw new Error("Marks obtained cannot exceed maximum marks");
  }

  return { exam, student };
};

const ensureTeacherPermission = async (teacherId, classId, subjectId) => {
  const teacher = await User.findById(teacherId).lean();
  if (!teacher || teacher.role !== "teacher")
    throw new Error("Teacher not found or unauthorized");

  const assignedClasses = (teacher.assignedClasses || []).map(String);
  if (!assignedClasses.includes(String(classId))) {
    throw new Error("You are not assigned to this class");
  }

  if (teacher.assignedSubjects?.length > 0) {
    const assignedSubjects = teacher.assignedSubjects.map(String);
    if (!assignedSubjects.includes(String(subjectId))) {
      throw new Error("You are not assigned to this subject");
    }
  }

  return true;
};

/* ============================================================
   GET ALL MARKS (WITH includeDeleted SUPPORT)
============================================================ */
export const getAllMarks = async (
  filters = {},
  page = 1,
  limit = 50,
  user = null
) => {
  const safePage = safeNum(page);
  const safeLimit = safeNum(limit);
  const skip = (safePage - 1) * safeLimit;

  const includeDeleted = normalizeIncludeDeleted(filters.includeDeleted);
  delete filters.includeDeleted;

  const q = {};

  // *** INCLUDE DELETED LOGIC ***
  if (!includeDeleted) q.isDeleted = false;

  if (filters.studentId && isValidId(filters.studentId))
    q.studentId = filters.studentId;

  if (filters.examId && isValidId(filters.examId)) q.examId = filters.examId;

  if (filters.subjectId && isValidId(filters.subjectId))
    q.subjectId = filters.subjectId;

  if (filters.search) {
    const escaped = escapeStringRegexp(String(filters.search));
    q.$or = [{ remarks: new RegExp(escaped, "i") }];
  }

  /* -----------------------------------------
     Teacher filtering — allowed classes only
  ------------------------------------------ */
  if (user && user.role === "teacher") {
    const teacher = await User.findById(user._id).lean();
    const allowed = (teacher.assignedClasses || []).map(String);

    if (allowed.length === 0) {
      return {
        marks: [],
        total: 0,
        page: safePage,
        limit: safeLimit,
        totalPages: 0,
      };
    }

    const allowedExams = await Exam.find({
      classId: { $in: allowed },
      ...(includeDeleted ? {} : { isDeleted: false }),
    })
      .select("_id")
      .lean();

    q.examId = { $in: allowedExams.map((e) => e._id) };
  }

  const total = await Mark.countDocuments(q);

  const marks = await Mark.find(q)
    .populate([
      { path: "studentId", select: "name email classId" },
      { path: "examId", select: "name examDate classId subjectId" },
      { path: "subjectId", select: "name code" },
      { path: "gradedBy", select: "name email role" },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  return {
    marks,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/* ============================================================
   GET ONE (WITH includeDeleted SUPPORT)
============================================================ */
export const getMarkById = async (id, filters = {}, user = null) => {
  if (!isValidId(id)) throw new Error("Invalid mark ID");

  const includeDeleted = normalizeIncludeDeleted(filters.includeDeleted);

  const q = { _id: id };
  if (!includeDeleted) q.isDeleted = false;

  const mark = await Mark.findOne(q).populate([
    { path: "studentId", select: "name email classId" },
    { path: "examId", select: "name examDate classId subjectId" },
    { path: "subjectId", select: "name code" },
    { path: "gradedBy", select: "name email role" },
  ]);

  if (!mark) return null;

  if (user && user.role === "teacher") {
    await ensureTeacherPermission(
      user._id,
      mark.examId.classId,
      mark.subjectId
    );
  }

  return mark;
};

/* ============================================================
   CREATE
============================================================ */
export const createMark = async (data, actor) => {
  const { examId, studentId, subjectId, marksObtained, maxMarks } = data;

  const { exam } = await validateMarkInput({
    examId,
    studentId,
    subjectId,
    marksObtained,
    maxMarks,
  });

  if (actor.role === "teacher") {
    await ensureTeacherPermission(actor._id, exam.classId, subjectId);
  } else if (actor.role !== "admin") {
    throw new Error("Not authorized to create marks");
  }

  try {
    const doc = await Mark.create({ ...data, gradedBy: actor._id });
    return await doc.populate([
      { path: "studentId", select: "name email classId" },
      { path: "examId", select: "name examDate classId subjectId" },
      { path: "subjectId", select: "name code" },
      { path: "gradedBy", select: "name email role" },
    ]);
  } catch (err) {
    if (err.code === 11000)
      throw new Error("Marks already exist for this student/exam/subject");
    throw err;
  }
};

/* ============================================================
   UPDATE
============================================================ */
export const updateMarkById = async (id, updates, actor) => {
  if (!isValidId(id)) throw new Error("Invalid mark ID");

  const mark = await Mark.findById(id).populate("examId subjectId");
  if (!mark || mark.isDeleted) throw new Error("Mark record not found");

  if (updates.studentId || updates.examId || updates.subjectId) {
    throw new Error("Cannot modify examId, studentId, or subjectId");
  }

  if (actor.role === "teacher") {
    await ensureTeacherPermission(
      actor._id,
      mark.examId.classId,
      mark.subjectId._id
    );
  } else if (actor.role !== "admin") {
    throw new Error("Not authorized to update marks");
  }

  if (updates.marksObtained !== undefined || updates.maxMarks !== undefined) {
    const newMarks = updates.marksObtained ?? mark.marksObtained;
    const newMax = updates.maxMarks ?? mark.maxMarks;
    if (newMarks > newMax)
      throw new Error("Marks obtained cannot exceed maximum marks");
  }

  return Mark.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate([
    { path: "studentId", select: "name email classId" },
    { path: "examId", select: "name examDate classId subjectId" },
    { path: "subjectId", select: "name code" },
    { path: "gradedBy", select: "name email role" },
  ]);
};

/* ============================================================
   DELETE (SOFT)
============================================================ */
export const deleteMarkById = async (id, actor) => {
  if (!isValidId(id)) throw new Error("Invalid mark ID");

  const mark = await Mark.findById(id).populate("examId subjectId");
  if (!mark || mark.isDeleted) throw new Error("Mark record not found");

  if (actor.role === "teacher") {
    await ensureTeacherPermission(
      actor._id,
      mark.examId.classId,
      mark.subjectId._id
    );
  } else if (actor.role !== "admin") {
    throw new Error("Not authorized to delete marks");
  }

  return mark.softDelete();
};

/* ============================================================
   BULK DELETE
============================================================ */
export const bulkDeleteMarks = async (ids, actor) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("IDs required");

  if (actor.role !== "admin") throw new Error("Not authorized");

  return Mark.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};
