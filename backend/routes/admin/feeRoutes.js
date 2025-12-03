// backend/routes/admin/feeRoutes.js

import express from "express";
import mongoose from "mongoose";

import {
  getFeeRecords,
  getFeeRecordById,
  createFee,
  updateFeeRecord,
  addPayment,
  deleteFee,
  bulkDeleteFees,
} from "../../controllers/admin/feeController.js";

import sessionMiddleware from "../../middlewares/sessionMiddleware.js";
import { authorize as requireRoles } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/* ============================================================
   VALIDATE OBJECT ID
============================================================ */
const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid fee ID",
    });
  }
  next();
};

/* ============================================================
   AUTHENTICATION (ADMIN PANEL)
============================================================ */
router.use(sessionMiddleware);

/* ============================================================
   VIEW FEES (ADMIN + TEACHER)
============================================================ */
router.get(
  "/",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  getFeeRecords
);

router.get(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  getFeeRecordById
);

/* ============================================================
   CREATE / UPDATE / DELETE FEES (ADMIN ONLY)
============================================================ */
router.post("/", requireRoles(["ADMIN", "SUPER_ADMIN"]), createFee);

router.patch(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  validateId,
  updateFeeRecord
);

router.delete(
  "/:id",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  validateId,
  deleteFee
);

router.post(
  "/bulk-delete",
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  bulkDeleteFees
);

/* ============================================================
   ADD PAYMENT (ADMIN + TEACHER)
============================================================ */
router.post(
  "/:id/payment",
  requireRoles(["ADMIN", "SUPER_ADMIN", "TEACHER"]),
  validateId,
  addPayment
);

export default router;
