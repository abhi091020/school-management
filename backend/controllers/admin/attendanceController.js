// controllers/admin/attendanceController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import attendanceService from "../../services/admin/attendanceService.js";

/* ---------------- GET ALL ---------------- */
export const getAttendance = asyncHandler(async (req, res) => {
  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  // Filters including includeDeleted (VERY IMPORTANT)
  const filters = req.modelQuery || {};

  const result = await attendanceService.getAllAttendance(filters, page, limit);

  res.json({
    success: true,
    data: result.records,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
    message: "Attendance fetched successfully",
  });
});

/* ---------------- GET ONE ---------------- */
export const getAttendanceById = asyncHandler(async (req, res) => {
  // Forward includeDeleted to the service
  const filters = req.modelQuery || {};

  const record = await attendanceService.getAttendanceById(
    req.params.id,
    filters
  );

  if (!record) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  res.json({ success: true, data: record });
});

/* ---------------- CREATE ---------------- */
export const createAttendance = asyncHandler(async (req, res) => {
  const record = await attendanceService.createAttendance(req.body, req.userId);

  res.status(201).json({
    success: true,
    data: record,
    message: "Attendance marked successfully",
  });
});

/* ---------------- UPDATE ---------------- */
export const updateAttendance = asyncHandler(async (req, res) => {
  const updated = await attendanceService.updateAttendanceById(
    req.params.id,
    req.body,
    req.userId
  );

  res.json({
    success: true,
    data: updated,
    message: "Attendance updated successfully",
  });
});

/* ---------------- DELETE ---------------- */
export const deleteAttendance = asyncHandler(async (req, res) => {
  await attendanceService.deleteAttendanceById(req.params.id, req.userId);

  res.json({
    success: true,
    message: "Attendance deleted successfully",
  });
});

/* ---------------- BULK DELETE ---------------- */
export const bulkDeleteAttendance = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids?.length)
    return res.status(400).json({ success: false, message: "IDs missing" });

  await attendanceService.bulkDeleteAttendance(ids, req.userId);

  res.json({
    success: true,
    message: "Attendance records deleted successfully",
  });
});
