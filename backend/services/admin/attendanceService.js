// backend/services/admin/attendanceService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";

import Attendance from "../../models/admin/Attendance.js";
import User from "../../models/admin/User.js";

/* ============================================================
   VALIDATION HELPERS
============================================================ */
const validateStudent = async (studentId, classId) => {
  const student = await User.findOne({
    _id: studentId,
    role: "student",
    status: "active",
    isDeleted: false,
  }).lean();

  if (!student) throw new Error("Invalid student");

  if (!student.classId || student.classId.toString() !== classId.toString()) {
    throw new Error("Student does not belong to this class");
  }
};

const validateTeacherPermission = async (teacher, classId) => {
  if (!teacher) throw new Error("Invalid teacher");

  if (teacher.role === "admin" || teacher.role === "super_admin") return true;

  const assigned = teacher.assignedClasses?.map(String) || [];

  if (!assigned.includes(classId.toString())) {
    throw new Error("Not authorized to manage attendance for this class");
  }
};

/* ============================================================
   GET ALL — includeDeleted supported
============================================================ */
const getAllAttendance = async (filters = {}, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  /* -------------------------
     NORMALIZE includeDeleted
     ------------------------- */
  const includeDeleted =
    filters.includeDeleted === true ||
    filters.includeDeleted === "true" ||
    filters.includeDeleted === "1";

  // Pass flag into mongoose pre-hook
  filters.includeDeleted = includeDeleted;

  // Never trust client manually setting isDeleted
  delete filters.isDeleted;

  // ----------------- Search -----------------
  if (filters.search) {
    const escaped = escapeStringRegexp(String(filters.search));
    const re = new RegExp(escaped, "i");
    filters.$or = [{ remarks: re }, { status: re }];
    delete filters.search;
  }

  const records = await Attendance.find(filters)
    .populate([
      { path: "studentId", select: "name email classId" },
      { path: "classId", select: "name section" },
      { path: "markedBy", select: "name email role" },
    ])
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 })
    .lean();

  const total = await Attendance.countDocuments(filters);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    records,
  };
};

/* ============================================================
   GET ONE — includeDeleted supported
============================================================ */
const getAttendanceById = async (id, filters = {}) => {
  const includeDeleted =
    filters.includeDeleted === true ||
    filters.includeDeleted === "true" ||
    filters.includeDeleted === "1";

  const query = {
    _id: id,
    includeDeleted, // <-- pass flag to pre-hook
  };

  return Attendance.findOne(query).populate([
    { path: "studentId", select: "name email classId" },
    { path: "classId", select: "name section" },
    { path: "markedBy", select: "name email role" },
  ]);
};

/* ============================================================
   CREATE
============================================================ */
const createAttendance = async (data, teacherId) => {
  const { studentId, classId, date } = data;

  if (!date) throw new Error("Date is required");
  if (isNaN(Date.parse(date))) throw new Error("Invalid date format");

  await validateStudent(studentId, classId);

  const teacher = await User.findById(teacherId);
  await validateTeacherPermission(teacher, classId);

  try {
    data.status = data.status?.toLowerCase();
    data.markedBy = teacherId;

    return await Attendance.create(data);
  } catch (err) {
    if (err.code === 11000) {
      throw new Error(
        "Attendance already marked for this student on this date"
      );
    }
    throw err;
  }
};

/* ============================================================
   UPDATE
============================================================ */
const updateAttendanceById = async (id, updates, teacherId) => {
  delete updates.studentId;
  delete updates.classId;
  delete updates.date;

  const record = await Attendance.findOne({ _id: id, isDeleted: false });
  if (!record) throw new Error("Attendance not found");

  const teacher = await User.findById(teacherId);
  await validateTeacherPermission(teacher, record.classId);

  if (updates.status) updates.status = updates.status.toLowerCase();

  return Attendance.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "studentId", select: "name email classId" },
    { path: "classId", select: "name section" },
    { path: "markedBy", select: "name email role" },
  ]);
};

/* ============================================================
   DELETE (SOFT DELETE)
============================================================ */
const deleteAttendanceById = async (id, teacherId) => {
  const record = await Attendance.findOne({ _id: id, isDeleted: false });
  if (!record) throw new Error("Attendance not found");

  const teacher = await User.findById(teacherId);
  await validateTeacherPermission(teacher, record.classId);

  return record.softDelete();
};

/* ============================================================
   BULK DELETE
============================================================ */
const bulkDeleteAttendance = async (ids, teacherId) => {
  if (!ids.every((id) => mongoose.isValidObjectId(id))) {
    throw new Error("Invalid IDs");
  }

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "admin") {
    throw new Error("Only administrators can perform bulk operations");
  }

  return Attendance.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date() }
  );
};

/* ============================================================
   EXPORT
============================================================ */
export default {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendanceById,
  deleteAttendanceById,
  bulkDeleteAttendance,
};
