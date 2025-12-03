// controllers/admin/examController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import * as examService from "../../services/admin/examService.js";
import { throwError } from "../../utils/response.js";

/* ============================================================
   GET ALL EXAMS
   - Supports includeDeleted via req.modelQuery
============================================================ */
export const getExams = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const { exams, total, totalPages } = await examService.getAllExams(
    { ...filters, ...req.query },
    page,
    limit
  );

  res.json({
    success: true,
    data: exams,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
    },
    message: "Exams fetched successfully",
  });
});

/* ============================================================
   GET EXAM BY ID
   - Supports includeDeleted via req.modelQuery
============================================================ */
export const getExamById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const exam = await examService.getExamById(req.params.id, filters);

  if (!exam) throwError("Exam not found", 404);

  res.json({
    success: true,
    data: exam,
    message: "Exam fetched successfully",
  });
});

/* ============================================================
   CREATE EXAM
============================================================ */
export const createExam = asyncHandler(async (req, res) => {
  const exam = await examService.createExam(req.body, req.userId, req.userRole);

  res.status(201).json({
    success: true,
    data: exam,
    message: "Exam created successfully",
  });
});

/* ============================================================
   UPDATE EXAM
============================================================ */
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await examService.updateExamById(
    req.params.id,
    req.body,
    req.userId,
    req.userRole
  );

  res.json({
    success: true,
    data: exam,
    message: "Exam updated successfully",
  });
});

/* ============================================================
   DELETE EXAM (Soft Delete)
============================================================ */
export const deleteExam = asyncHandler(async (req, res) => {
  await examService.deleteExamById(req.params.id, req.userId, req.userRole);

  res.json({
    success: true,
    message: "Exam deleted successfully",
  });
});

/* ============================================================
   BULK DELETE EXAMS (Admin Only)
============================================================ */
export const bulkDeleteExams = asyncHandler(async (req, res) => {
  await examService.bulkDeleteExams(req.body.ids);

  res.json({
    success: true,
    message: "Exams deleted successfully",
  });
});
