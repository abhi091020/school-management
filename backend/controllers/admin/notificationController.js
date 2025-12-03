// backend/controllers/admin/notificationController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import * as notificationService from "../../services/admin/notificationService.js";

/* ============================================================
   GET ALL (supports includeDeleted)
============================================================ */
export const getNotifications = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const { notifications, total } = await notificationService.getNotifications(
    req.userId,
    { ...filters, ...req.query }
  );

  res.json({
    success: true,
    data: notifications,
    total,
    message: "Notifications fetched successfully",
  });
});

/* ============================================================
   GET ONE (supports includeDeleted)
============================================================ */
export const getNotificationById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const notification = await notificationService.getNotificationById(
    req.params.id,
    req.userId,
    filters
  );

  if (!notification) throwError("Notification not found", 404);

  res.json({
    success: true,
    data: notification,
    message: "Notification fetched successfully",
  });
});

/* ============================================================
   CREATE
============================================================ */
export const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(
    req.body,
    req.userId
  );

  res.status(201).json({
    success: true,
    data: notification,
    message: "Notification created successfully",
  });
});

/* ============================================================
   UPDATE STATUS (read/unread)
============================================================ */
export const updateNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.updateNotificationStatus(
    req.params.id,
    req.body.status,
    req.userId
  );

  res.json({
    success: true,
    data: notification,
    message: "Notification status updated successfully",
  });
});

/* ============================================================
   DELETE (Soft delete)
============================================================ */
export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotificationById(req.params.id, req.userId);

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
});

/* ============================================================
   BULK DELETE (Admin only)
============================================================ */
export const bulkDeleteNotifications = asyncHandler(async (req, res) => {
  await notificationService.bulkDeleteNotifications(req.body.ids, req.userId);

  res.json({
    success: true,
    message: "Notifications deleted successfully",
  });
});
