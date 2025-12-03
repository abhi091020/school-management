// controllers/admin/subjectController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import * as subjectService from "../../services/admin/subjectService.js";

/* ============================================================
   GET SUBJECTS (supports includeDeleted)
============================================================ */
export const getSubjects = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  // Additional filters from query
  if (req.query.status) filters.status = req.query.status;
  if (req.query.teacher) filters.teachers = req.query.teacher;
  if (req.query.class) filters.classes = req.query.class;
  if (req.query.search) filters.$text = { $search: req.query.search };

  const { subjects, total, totalPages } = await subjectService.getAllSubjects(
    filters,
    page,
    limit
  );

  res.json({
    success: true,
    data: subjects,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
    },
  });
});

/* ============================================================
   GET SUBJECT BY ID (supports includeDeleted)
============================================================ */
export const getSubjectById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const subject = await subjectService.getSubjectById(req.params.id, filters);

  if (!subject) {
    return res
      .status(404)
      .json({ success: false, message: "Subject not found" });
  }

  res.json({ success: true, data: subject });
});

/* ============================================================
   CREATE SUBJECT
============================================================ */
export const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);

  res.status(201).json({
    success: true,
    data: subject,
    message: "Subject created successfully",
  });
});

/* ============================================================
   UPDATE SUBJECT
============================================================ */
export const updateSubject = asyncHandler(async (req, res) => {
  const updated = await subjectService.updateSubjectById(
    req.params.id,
    req.body
  );

  if (!updated) {
    return res
      .status(404)
      .json({ success: false, message: "Subject not found" });
  }

  res.json({
    success: true,
    data: updated,
    message: "Subject updated successfully",
  });
});

/* ============================================================
   DELETE SUBJECT (Soft delete)
============================================================ */
export const deleteSubject = asyncHandler(async (req, res) => {
  await subjectService.deleteSubjectById(req.params.id);

  res.json({ success: true, message: "Subject deleted successfully" });
});

/* ============================================================
   BULK DELETE SUBJECTS
============================================================ */
export const bulkDeleteSubjects = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "IDs required" });
  }

  await subjectService.bulkDeleteSubjects(ids);

  res.json({ success: true, message: "Subjects deleted" });
});
