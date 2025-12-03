// services/admin/classService.js

import mongoose from "mongoose";
import escapeStringRegexp from "escape-string-regexp";

import Class from "../../models/admin/Class.js";
import User from "../../models/admin/User.js";
import Subject from "../../models/admin/Subject.js";

/* ============================================================
   HELPERS
============================================================ */
const safeNumber = (num, fallback, max = 200) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const ensureValidObjectId = (id, label = "ID") => {
  if (!id) return;
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${label}`);
  }
};

/* ============================================================
   VALIDATIONS
============================================================ */
const validateClassTeacher = async (teacherId) => {
  if (!teacherId) return;

  ensureValidObjectId(teacherId, "classTeacher");

  const teacher = await User.findOne({
    _id: teacherId,
    role: "teacher",
    status: "active",
    isDeleted: false,
  }).lean();

  if (!teacher) {
    throw new Error("Assigned class teacher does not exist or is inactive");
  }
};

const validateSubjects = async (subjectIds) => {
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) return;

  for (const id of subjectIds) {
    ensureValidObjectId(id, "subjectId");

    const subject = await Subject.findOne({
      _id: id,
      status: "active",
      isDeleted: false,
    }).lean();

    if (!subject) {
      throw new Error("One or more subjects are invalid or inactive");
    }
  }
};

const validateStudents = async (studentIds) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) return;

  for (const id of studentIds) {
    ensureValidObjectId(id, "studentId");

    const student = await User.findOne({
      _id: id,
      role: "student",
      status: "active",
      isDeleted: false,
    }).lean();

    if (!student) {
      throw new Error("One or more students are invalid or inactive");
    }
  }
};

/* ============================================================
   CREATE CLASS
============================================================ */
export const createClass = async (data) => {
  const { classTeacher, subjects = [], students = [] } = data;

  // Pre-validations
  await validateClassTeacher(classTeacher);
  await validateSubjects(subjects);
  await validateStudents(students);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdArr = await Class.create([data], { session });
    const classDoc = createdArr[0];

    if (students.length > 0) {
      const conflict = await User.findOne({
        _id: { $in: students },
        classId: { $ne: null, $nin: [classDoc._id] },
      }).session(session);

      if (conflict) {
        throw new Error(
          `Student ${conflict._id} already belongs to another class`
        );
      }

      await User.updateMany(
        { _id: { $in: students } },
        { $set: { classId: classDoc._id } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return await Class.findById(classDoc._id)
      .populate("classTeacher", "name email phone")
      .populate("subjects", "name code")
      .populate("students", "name email userId")
      .lean();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      throw new Error("A class with the same name & section already exists");
    }

    throw err;
  }
};

/* ============================================================
   GET ALL CLASSES — includeDeleted supported
============================================================ */
export const getAllClasses = async (options = {}) => {
  const page = safeNumber(options.page, 1);
  const limit = safeNumber(options.limit, 50);

  const includeDeleted =
    options.includeDeleted === true ||
    options.includeDeleted === "true" ||
    options.includeDeleted === "1";

  const filter = {};

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  if (options.status) {
    filter.status = String(options.status).toLowerCase();
  }

  if (options.search) {
    const re = new RegExp(escapeStringRegexp(options.search), "i");
    filter.$or = [{ name: re }, { section: re }];
  }

  const skip = (page - 1) * limit;

  const classes = await Class.find({ ...filter, includeDeleted })
    .select("name section classTeacher status createdAt")
    .populate("classTeacher", "name email phone")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Class.countDocuments(filter);

  return {
    classes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/* ============================================================
   GET CLASS BY ID — includeDeleted supported
============================================================ */
export const getClassById = async (id, filters = {}) => {
  ensureValidObjectId(id, "classId");

  const includeDeleted =
    filters.includeDeleted === true ||
    filters.includeDeleted === "true" ||
    filters.includeDeleted === "1";

  const query = { _id: id, includeDeleted };

  return Class.findOne(query)
    .populate("classTeacher", "name email phone")
    .populate("subjects", "name code")
    .populate("students", "name email userId")
    .lean();
};

/* ============================================================
   UPDATE CLASS
============================================================ */
export const updateClass = async (id, updates) => {
  ensureValidObjectId(id, "classId");

  await validateClassTeacher(updates.classTeacher);
  await validateSubjects(updates.subjects);
  await validateStudents(updates.students);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await Class.findById(id).session(session);
    if (!existing) throw new Error("Class not found");

    if (Array.isArray(updates.students)) {
      const oldIds = existing.students.map(String);
      const newIds = updates.students.map(String);

      const toAdd = newIds.filter((x) => !oldIds.includes(x));
      const toRemove = oldIds.filter((x) => !newIds.includes(x));

      if (toAdd.length > 0) {
        const conflict = await User.findOne({
          _id: { $in: toAdd },
          classId: { $ne: null, $nin: [existing._id] },
        }).session(session);

        if (conflict) {
          throw new Error(`Student ${conflict._id} belongs to another class`);
        }

        await User.updateMany(
          { _id: { $in: toAdd } },
          { $set: { classId: existing._id } },
          { session }
        );
      }

      if (toRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: toRemove } },
          { $unset: { classId: "" } },
          { session }
        );
      }
    }

    const updated = await Class.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      session,
    })
      .populate("classTeacher", "name email phone")
      .populate("subjects", "name code")
      .populate("students", "name email userId")
      .lean();

    await session.commitTransaction();
    session.endSession();

    return updated;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      throw new Error("A class with the same name & section already exists");
    }

    throw err;
  }
};

/* ============================================================
   DELETE CLASS (SOFT)
============================================================ */
export const deleteClass = async (id, options = {}) => {
  ensureValidObjectId(id, "classId");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cls = await Class.findById(id).session(session);
    if (!cls) throw new Error("Class not found");

    if (cls.isDeleted) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Class already deleted");
    }

    cls.isDeleted = true;
    cls.status = "inactive";
    cls.deletedAt = new Date();
    await cls.save({ session });

    const unsetStudents = options.unsetStudents !== false;

    if (unsetStudents && cls.students.length > 0) {
      await User.updateMany(
        { _id: { $in: cls.students } },
        { $unset: { classId: "" } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return await Class.findById(id)
      .populate("classTeacher", "name email phone")
      .populate("subjects", "name code")
      .populate("students", "name email userId")
      .lean();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
