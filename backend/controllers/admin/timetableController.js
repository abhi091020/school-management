// controllers/admin/timetableController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import * as timetableService from "../../services/admin/timetableService.js";

/* ============================================================
   GET TIMETABLES (Supports includeDeleted)
============================================================ */
export const getTimetables = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 200;

  // Additional filters
  if (req.query.classId) filters.classId = req.query.classId;
  if (req.query.teacherId) filters.teacherId = req.query.teacherId;
  if (req.query.subjectId) filters.subjectId = req.query.subjectId;
  if (req.query.day) filters.day = req.query.day;

  const { timetables, total, totalPages } =
    await timetableService.getAllTimetables(filters, page, limit);

  return res.status(200).json({
    success: true,
    data: timetables,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
    },
    message: "Timetables fetched successfully",
  });
});

/* ============================================================
   GET TIMETABLE BY ID (Supports includeDeleted)
============================================================ */
export const getTimetableById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const timetable = await timetableService.getTimetableById(
    req.params.id,
    filters
  );

  if (!timetable) {
    return res
      .status(404)
      .json({ success: false, message: "Timetable entry not found" });
  }

  return res.json({ success: true, data: timetable });
});

/* ============================================================
   CREATE TIMETABLE
============================================================ */
export const createTimetable = asyncHandler(async (req, res) => {
  const entry = await timetableService.createTimetable(req.body);

  return res.status(201).json({
    success: true,
    data: entry,
    message: "Timetable entry created successfully",
  });
});

/* ============================================================
   UPDATE TIMETABLE
============================================================ */
export const updateTimetable = asyncHandler(async (req, res) => {
  const updated = await timetableService.updateTimetableById(
    req.params.id,
    req.body
  );

  if (!updated) {
    return res
      .status(404)
      .json({ success: false, message: "Timetable entry not found" });
  }

  return res.json({
    success: true,
    data: updated,
    message: "Timetable entry updated successfully",
  });
});

/* ============================================================
   DELETE TIMETABLE (Soft Delete)
============================================================ */
export const deleteTimetable = asyncHandler(async (req, res) => {
  await timetableService.deleteTimetableById(req.params.id);

  return res.json({
    success: true,
    message: "Timetable entry deleted successfully",
  });
});

/* ============================================================
   BULK DELETE TIMETABLES
============================================================ */
export const bulkDeleteTimetables = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "IDs array is required" });
  }

  await timetableService.bulkDeleteTimetables(ids);

  return res.json({
    success: true,
    message: "Timetable entries deleted successfully",
  });
});
