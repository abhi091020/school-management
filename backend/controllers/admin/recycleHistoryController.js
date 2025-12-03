// backend/controllers/admin/recycleHistoryController.js

import { throwError } from "../../utils/response.js";
import * as recycleHistoryService from "../../services/admin/recycleHistoryService.js";

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
   ALLOWED ACTIONS
============================================================================ */
const ALLOWED_ACTIONS = ["deleted", "restored", "permanently_deleted"];

/* ============================================================================
   VALIDATE PAGINATION
============================================================================ */
const validatePagination = (page, limit) => {
  const p = Number(page);
  const l = Number(limit);

  if (!Number.isInteger(p) || p < 1) {
    throwError("Invalid page number. Must be a positive integer.", 400);
  }

  if (!Number.isInteger(l) || l < 1 || l > 100) {
    throwError("Invalid limit. Must be between 1 and 100.", 400);
  }

  return { page: p, limit: l };
};

/* ============================================================================
   GET RECYCLE HISTORY
============================================================================ */
export const getRecycleHistory = async (req, res, next) => {
  try {
    const {
      type,
      itemId,
      action,
      page = 1,
      limit = 20,
      fromDate,
      toDate,
      search = "",
      sortBy = "timestamp_desc",
    } = req.query;

    // Validate pagination
    const { page: validPage, limit: validLimit } = validatePagination(
      page,
      limit
    );

    // Validate type (optional filter)
    let normalizedType = null;
    if (type && type !== "all") {
      normalizedType = String(type).toLowerCase().trim();
      if (!ALLOWED_TYPES.includes(normalizedType)) {
        throwError(
          `Invalid type '${normalizedType}'. Allowed types: ${ALLOWED_TYPES.join(
            ", "
          )}`,
          400
        );
      }
    }

    // Validate action (optional filter)
    let normalizedActions = null;
    if (action) {
      const actionList = String(action)
        .toLowerCase()
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const invalidActions = actionList.filter(
        (a) => !ALLOWED_ACTIONS.includes(a)
      );

      if (invalidActions.length > 0) {
        throwError(
          `Invalid action(s): ${invalidActions.join(
            ", "
          )}. Allowed: ${ALLOWED_ACTIONS.join(", ")}`,
          400
        );
      }

      normalizedActions = actionList;
    }

    // Validate dates
    if (fromDate && isNaN(Date.parse(fromDate))) {
      throwError("Invalid fromDate format. Use YYYY-MM-DD.", 400);
    }

    if (toDate && isNaN(Date.parse(toDate))) {
      throwError("Invalid toDate format. Use YYYY-MM-DD.", 400);
    }

    // Validate sortBy
    const allowedSorts = [
      "timestamp_desc",
      "timestamp_asc",
      "deletedAt_desc",
      "deletedAt_asc",
    ];

    const normalizedSort = allowedSorts.includes(sortBy)
      ? sortBy
      : "timestamp_desc";

    // Call service
    const result = await recycleHistoryService.getRecycleHistory({
      type: normalizedType,
      itemId: itemId || null,
      actions: normalizedActions,
      page: validPage,
      limit: validLimit,
      fromDate: fromDate || null,
      toDate: toDate || null,
      search: search.trim(),
      sortBy: normalizedSort,
    });

    return res.status(200).json({
      success: true,
      message: `Retrieved ${result.items.length} history record(s)`,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};
