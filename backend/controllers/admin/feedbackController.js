// controllers/admin/feedbackController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import * as feedbackService from "../../services/admin/feedbackService.js";

/* ============================================================
   GET ALL (Supports includeDeleted via req.modelQuery)
============================================================ */
export const getFeedbacks = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const { feedbacks, total, totalPages } =
    await feedbackService.getAllFeedbacks(
      { ...filters, ...req.query },
      page,
      limit
    );

  res.json({
    success: true,
    data: feedbacks,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
    },
    message: "Feedback fetched successfully",
  });
});

/* ============================================================
   GET ONE (Supports includeDeleted)
============================================================ */
export const getFeedbackById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const feedback = await feedbackService.getFeedbackById(
    req.params.id,
    filters
  );

  if (!feedback) throwError("Feedback not found", 404);

  res.json({
    success: true,
    data: feedback,
    message: "Feedback fetched successfully",
  });
});

/* ============================================================
   CREATE FEEDBACK
============================================================ */
export const createFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createFeedback(req.body, req.userId);

  res.status(201).json({
    success: true,
    data: feedback,
    message: "Feedback created successfully",
  });
});

/* ============================================================
   UPDATE FEEDBACK (fields + content)
============================================================ */
export const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.updateFeedbackById(
    req.params.id,
    req.body,
    req.userId
  );

  res.json({
    success: true,
    data: feedback,
    message: "Feedback updated successfully",
  });
});

/* ============================================================
   UPDATE STATUS / ADD REPLY
============================================================ */
export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status, reply } = req.body;

  const feedback = await feedbackService.updateFeedbackStatus(
    req.params.id,
    { status, reply },
    req.userId
  );

  res.json({
    success: true,
    data: feedback,
    message: "Feedback status updated successfully",
  });
});

/* ============================================================
   DELETE (Soft Delete)
============================================================ */
export const deleteFeedback = asyncHandler(async (req, res) => {
  await feedbackService.deleteFeedbackById(req.params.id);

  res.json({
    success: true,
    message: "Feedback deleted successfully",
  });
});
