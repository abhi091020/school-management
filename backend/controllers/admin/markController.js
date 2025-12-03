// controllers/admin/markController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import * as markService from "../../services/admin/markService.js";

/* ============================================================
   GET ALL (supports includeDeleted via req.modelQuery)
============================================================ */
export const getMarks = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const { marks, total, totalPages } = await markService.getAllMarks(
    { ...filters, ...req.query },
    page,
    limit
  );

  res.json({
    success: true,
    data: marks,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
    },
    message: "Marks fetched successfully",
  });
});

/* ============================================================
   GET ONE (supports includeDeleted)
============================================================ */
export const getMarkById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const mark = await markService.getMarkById(req.params.id, filters);

  if (!mark) throwError("Mark record not found", 404);

  res.json({
    success: true,
    data: mark,
    message: "Mark record fetched successfully",
  });
});

/* ============================================================
   CREATE MARK
============================================================ */
export const createMark = asyncHandler(async (req, res) => {
  const mark = await markService.createMark(req.body, req.userId);

  res.status(201).json({
    success: true,
    data: mark,
    message: "Mark record created successfully",
  });
});

/* ============================================================
   UPDATE MARK
============================================================ */
export const updateMark = asyncHandler(async (req, res) => {
  const mark = await markService.updateMarkById(
    req.params.id,
    req.body,
    req.userId
  );

  res.json({
    success: true,
    data: mark,
    message: "Mark record updated successfully",
  });
});

/* ============================================================
   DELETE MARK (Soft delete)
============================================================ */
export const deleteMark = asyncHandler(async (req, res) => {
  await markService.deleteMarkById(req.params.id);

  res.json({
    success: true,
    message: "Mark record deleted successfully",
  });
});

/* ============================================================
   BULK DELETE (Admin-only)
============================================================ */
export const bulkDeleteMarks = asyncHandler(async (req, res) => {
  await markService.bulkDeleteMarks(req.body.ids);

  res.json({
    success: true,
    message: "Mark records deleted successfully",
  });
});
