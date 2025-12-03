// backend/controllers/admin/recycleBinController.js

import { throwError } from "../../utils/response.js";
import * as recycleBinService from "../../services/admin/recycleBinService.js";

/* ============================================================================
   ALLOWED TYPES
============================================================================ */
const ALLOWED_TYPES = [
  "user",
  "admin",
  "student",
  "parent",
  "teacher",
  "class",
  "subject",
  "attendance",
  "exam",
  "mark",
  "timetable",
  "fee",
  "notification",
  "feedback",
];

/* ============================================================================
   SORT NORMALIZATION
============================================================================ */
const normalizeSort = (sortBy = "deletedAt_desc") => {
  const [field, order] = String(sortBy || "deletedAt_desc").split("_");
  const safeOrder = order === "asc" ? "asc" : "desc";
  const allowed = ["deletedAt", "name", "email", "userId"];
  const safeField = allowed.includes(field) ? field : "deletedAt";
  return `${safeField}_${safeOrder}`;
};

/* ============================================================================
   PAGINATION VALIDATION
============================================================================ */
const validatePagination = (page, limit) => {
  const p = Number(page);
  const l = Number(limit);

  if (!Number.isInteger(p) || p < 1) throwError("Invalid page number", 400);
  if (!Number.isInteger(l) || l < 1 || l > 100)
    throwError("Invalid limit (1-100)", 400);

  return { page: p, limit: l };
};

/* ============================================================================
   LIST DELETED ITEMS
============================================================================ */
export const listDeletedItems = async (req, res, next) => {
  try {
    const {
      type,
      page = 1,
      limit = 20,
      search = "",
      fromDate,
      toDate,
      sortBy,
    } = req.query;

    if (!type) throwError("Query param 'type' is required", 400);

    const normalizedType = String(type).toLowerCase().trim();
    if (!ALLOWED_TYPES.includes(normalizedType))
      throwError(`Invalid type '${normalizedType}'`, 400);

    const { page: validPage, limit: validLimit } = validatePagination(
      page,
      limit
    );

    if (fromDate && isNaN(Date.parse(fromDate)))
      throwError("Invalid fromDate (expected YYYY-MM-DD)", 400);
    if (toDate && isNaN(Date.parse(toDate)))
      throwError("Invalid toDate (expected YYYY-MM-DD)", 400);

    const normalizedSort = normalizeSort(sortBy);

    const result = await recycleBinService.listDeletedItems({
      type: normalizedType,
      page: validPage,
      limit: validLimit,
      search: String(search || "").trim(),
      fromDate: fromDate || null,
      toDate: toDate || null,
      sortBy: normalizedSort,
    });

    return res.status(200).json({
      success: true,
      message: `Retrieved ${result.items.length} deleted ${normalizedType} item(s)`,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================================
   RESTORE ITEMS - Service handles type detection automatically
============================================================================ */
export const restoreItems = async (req, res, next) => {
  try {
    const { type, ids } = req.body;

    if (!type) throwError("'type' field is required", 400);
    if (!Array.isArray(ids) || ids.length === 0)
      throwError("'ids' must be a non-empty array", 400);
    if (ids.length > 100)
      throwError("Cannot restore more than 100 items at once", 400);
    if (!req.user) throwError("Authentication required", 401);

    const normalizedType = String(type).toLowerCase().trim();
    if (!ALLOWED_TYPES.includes(normalizedType))
      throwError(`Invalid type '${normalizedType}'`, 400);

    // Service will auto-detect actual type from the item
    const restoredCount = await recycleBinService.restoreItems(
      normalizedType,
      ids,
      req.user
    );

    const totalRequested = ids.length;
    const restored = Number(restoredCount) || 0;
    const failed = totalRequested - restored;

    return res.status(200).json({
      success: true,
      restored,
      failed,
      requested: totalRequested,
      message:
        restored > 0
          ? `Successfully restored ${restored} of ${totalRequested} item(s)`
          : `No items restored. They may already be restored or permanently deleted.`,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================================
   HARD DELETE ITEMS
============================================================================ */
export const hardDeleteItems = async (req, res, next) => {
  try {
    const { type, ids } = req.body;

    if (!type) throwError("'type' field is required", 400);
    if (!Array.isArray(ids) || ids.length === 0)
      throwError("'ids' must be a non-empty array", 400);
    if (ids.length > 50)
      throwError("Cannot permanently delete more than 50 items at once", 400);

    const normalizedType = String(type).toLowerCase().trim();
    if (!ALLOWED_TYPES.includes(normalizedType))
      throwError(`Invalid type '${normalizedType}'`, 400);

    const removedCount = await recycleBinService.hardDeleteItems(
      normalizedType,
      ids,
      req.user || null
    );

    const totalRequested = ids.length;
    const deleted = Number(removedCount) || 0;
    const failed = totalRequested - deleted;

    return res.status(200).json({
      success: true,
      deleted,
      failed,
      requested: totalRequested,
      message:
        deleted > 0
          ? `Permanently deleted ${deleted} of ${totalRequested} item(s)`
          : `No items were permanently deleted. They may already be removed.`,
    });
  } catch (err) {
    next(err);
  }
};
