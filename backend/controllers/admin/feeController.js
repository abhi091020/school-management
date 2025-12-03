// controllers/admin/feeController.js

import asyncHandler from "../../middlewares/asyncHandler.js";
import { throwError } from "../../utils/response.js";
import * as feeService from "../../services/admin/feeService.js";

/* ============================================================
   GET ALL FEES (Supports includeDeleted)
============================================================ */
export const getFeeRecords = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const { fees, total, totalPages } = await feeService.getAllFeeRecords(
    { ...filters, ...req.query },
    page,
    limit
  );

  res.json({
    success: true,
    data: fees,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
    },
    message: "Fee records fetched successfully",
  });
});

/* ============================================================
   GET FEE BY ID (Supports includeDeleted)
============================================================ */
export const getFeeRecordById = asyncHandler(async (req, res) => {
  const filters = req.modelQuery || {};

  const fee = await feeService.getFeeRecordById(req.params.id, filters);

  if (!fee) throwError("Fee record not found", 404);

  res.json({
    success: true,
    data: fee,
    message: "Fee record fetched successfully",
  });
});

/* ============================================================
   CREATE FEE RECORD
============================================================ */
export const createFee = asyncHandler(async (req, res) => {
  const fee = await feeService.createFeeRecord(req.body, req.userId);

  res.status(201).json({
    success: true,
    data: fee,
    message: "Fee record created successfully",
  });
});

/* ============================================================
   ADD PAYMENT TO EXISTING FEE RECORD
============================================================ */
export const addPayment = asyncHandler(async (req, res) => {
  const payment = await feeService.addPayment(req.body, req.userId);

  res.status(201).json({
    success: true,
    data: payment,
    message: "Payment added successfully",
  });
});

/* ============================================================
   UPDATE FEE RECORD
============================================================ */
export const updateFeeRecord = asyncHandler(async (req, res) => {
  const fee = await feeService.updateFeeRecordById(
    req.params.id,
    req.body,
    req.userId
  );

  res.json({
    success: true,
    data: fee,
    message: "Fee record updated successfully",
  });
});

/* ============================================================
   DELETE (Soft Delete)
============================================================ */
export const deleteFee = asyncHandler(async (req, res) => {
  await feeService.deleteFeeRecordById(req.params.id);

  res.json({
    success: true,
    message: "Fee record deleted successfully",
  });
});

/* ============================================================
   BULK DELETE (Admin Only)
============================================================ */
export const bulkDeleteFees = asyncHandler(async (req, res) => {
  await feeService.bulkDeleteFeeRecordsByIds(req.body.ids);

  res.json({
    success: true,
    message: "Fee records deleted successfully",
  });
});
