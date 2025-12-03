// services/admin/subjectService.js

import mongoose from "mongoose";
import Subject from "../../models/admin/Subject.js";
import User from "../../models/admin/User.js";
import Class from "../../models/admin/Class.js";
import { throwError } from "../../utils/response.js";

/* ------------------------------------------------------
   Helpers
------------------------------------------------------ */
const safeNum = (n, fb = 1, max = 200) => {
  const x = parseInt(n, 10);
  return isNaN(x) || x < 1 ? fb : Math.min(x, max);
};

/* ------------------------------------------------------
   Validate Teacher IDs
------------------------------------------------------ */
export const validateTeachers = async (teacherIds = []) => {
  if (!Array.isArray(teacherIds) || teacherIds.length === 0) return;

  await Promise.all(
    teacherIds.map(async (id) => {
      if (!mongoose.isValidObjectId(id))
        throwError(`Invalid teacher ID: ${id}`, 400);

      const teacher = await User.findOne({
        _id: id,
        role: "teacher", // Your system uses lowercase roles everywhere else
        isDeleted: false,
        status: "active",
      }).select("_id");

      if (!teacher) {
        throwError(`Teacher ${id} not found, deleted, or inactive`, 404);
      }
    })
  );
};

/* ------------------------------------------------------
   Validate Class IDs
------------------------------------------------------ */
export const validateClasses = async (classIds = []) => {
  if (!Array.isArray(classIds) || classIds.length === 0) return;

  await Promise.all(
    classIds.map(async (id) => {
      if (!mongoose.isValidObjectId(id))
        throwError(`Invalid class ID: ${id}`, 400);

      const cls = await Class.findOne({
        _id: id,
        isDeleted: false,
        status: "active", // Your class model uses lowercase "active"
      }).select("_id");

      if (!cls) {
        throwError(`Class ${id} not found or inactive`, 404);
      }
    })
  );
};

/* ------------------------------------------------------
   Get All Subjects (Paginated + Filtered)
------------------------------------------------------ */
export const getAllSubjects = async (filters = {}, page = 1, limit = 50) => {
  const safePage = safeNum(page, 1, 1000);
  const safeLimit = safeNum(limit, 50, 1000);
  const skip = (safePage - 1) * safeLimit;

  const query = {
    isDeleted: false,
    ...filters,
  };

  const [subjects, total] = await Promise.all([
    Subject.find(query)
      .populate("teachers", "name email role")
      .populate("classes", "name section")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Subject.countDocuments(query),
  ]);

  return {
    subjects,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

/* ------------------------------------------------------
   Get Subject by ID
------------------------------------------------------ */
export const getSubjectById = async (id) => {
  if (!mongoose.isValidObjectId(id)) throwError("Invalid Subject ID", 400);

  return await Subject.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("teachers", "name email role")
    .populate("classes", "name section")
    .lean();
};

/* ------------------------------------------------------
   Create Subject
------------------------------------------------------ */
export const createSubject = async (data) => {
  await validateTeachers(data.teachers);
  await validateClasses(data.classes);

  try {
    return await Subject.create(data);
  } catch (err) {
    if (err.code === 11000) {
      throwError("Subject code already exists", 409);
    }
    throw err;
  }
};

/* ------------------------------------------------------
   Update Subject
------------------------------------------------------ */
export const updateSubjectById = async (id, updates) => {
  if (!mongoose.isValidObjectId(id)) throwError("Invalid Subject ID", 400);

  if (updates.teachers) await validateTeachers(updates.teachers);
  if (updates.classes) await validateClasses(updates.classes);

  try {
    const updated = await Subject.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    )
      .populate("teachers", "name email role")
      .populate("classes", "name section");

    if (!updated) throwError("Subject not found or deleted", 404);

    return updated;
  } catch (err) {
    if (err.code === 11000) throwError("Subject code already exists", 409);
    throw err;
  }
};

/* ------------------------------------------------------
   Delete Subject (Soft Delete)
------------------------------------------------------ */
export const deleteSubjectById = async (id) => {
  if (!mongoose.isValidObjectId(id)) throwError("Invalid Subject ID", 400);

  const subject = await Subject.findOne({
    _id: id,
  }).setOptions({ includeDeleted: true });

  if (!subject || subject.isDeleted)
    throwError("Subject not found or already deleted", 404);

  return await subject.softDelete();
};

/* ------------------------------------------------------
   Bulk Delete Subjects
------------------------------------------------------ */
export const bulkDeleteSubjects = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0)
    throwError("No Subject IDs provided", 400);

  return await Subject.updateMany(
    { _id: { $in: ids } },
    {
      isDeleted: true,
      deletedAt: new Date(),
    }
  );
};

/* ------------------------------------------------------
   Default Export
------------------------------------------------------ */
export default {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubjectById,
  deleteSubjectById,
  bulkDeleteSubjects,
};
