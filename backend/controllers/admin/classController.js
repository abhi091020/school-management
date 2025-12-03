// controllers/admin/classController.js

import mongoose from "mongoose";
import asyncHandler from "../../middlewares/asyncHandler.js";
import * as classService from "../../services/admin/classService.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

/* ============================================================
    CREATE CLASS
============================================================ */
export const createClass = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name?.trim(),
    section: req.body.section?.trim(),
    classTeacher: req.body.classTeacher || null,
    subjects: req.body.subjects || [],
    students: req.body.students || [],
  };

  const created = await classService.createClass(payload);

  return res.status(201).json({
    success: true,
    message: "Class created successfully",
    data: created,
  });
});

/* ============================================================
    GET ALL CLASSES
============================================================ */
export const getAllClasses = asyncHandler(async (req, res) => {
  // **CRITICAL FIX: Forward includeDeleted + filters**
  const filters = req.modelQuery || {};

  const pagination = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search || null,
    status: req.query.status || null,
  };

  const result = await classService.getAllClasses({
    ...filters,
    ...pagination,
  });

  return res.status(200).json({
    success: true,
    message: "Classes fetched successfully",
    data: result.classes,
    meta: {
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.page,
      limit: result.limit,
    },
  });
});

/* ============================================================
    GET CLASS BY ID
============================================================ */
export const getClassById = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid class ID",
    });
  }

  // **CRITICAL FIX: Forward includeDeleted**
  const filters = req.modelQuery || {};

  const classObj = await classService.getClassById(id, filters);

  if (!classObj) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Class fetched successfully",
    data: classObj,
  });
});

/* ============================================================
    UPDATE CLASS
============================================================ */
export const updateClass = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid class ID",
    });
  }

  const payload = {
    name: req.body.name?.trim(),
    section: req.body.section?.trim(),
    classTeacher: req.body.classTeacher || null,
    subjects: req.body.subjects || [],
    students: req.body.students || [],
  };

  const updated = await classService.updateClass(id, payload);

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Class updated successfully",
    data: updated,
  });
});

/* ============================================================
    DELETE CLASS (SOFT DELETE)
============================================================ */
export const deleteClass = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid class ID",
    });
  }

  const deleted = await classService.deleteClass(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Class deleted successfully",
    data: deleted,
  });
});
