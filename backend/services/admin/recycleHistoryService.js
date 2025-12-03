// backend/services/admin/recycleHistoryService.js

import RecycleHistory from "../../models/admin/RecycleHistory.js";
import { throwError } from "../../utils/response.js";

/* ============================================================================
   SORT MAP — Only indexed / safe fields
============================================================================ */
const SORT_MAP = {
  timestamp_desc: { timestamp: -1 },
  timestamp_asc: { timestamp: 1 },
  deletedAt_desc: { deletedAt: -1 },
  deletedAt_asc: { deletedAt: 1 },
};

/* ============================================================================
   SEARCH FIELDS (must match RecycleHistory indexes)
============================================================================ */
const SNAPSHOT_FIELDS = [
  "snapshot.name",
  "snapshot.email",
  "snapshot.userId",
  "snapshot.admissionNumber",
];

const ACTOR_FIELDS = ["performedBySnapshot.name", "performedBySnapshot.email"];

/* ============================================================================
   GET RECYCLE HISTORY (Paginated + Filter + Full Search)
============================================================================ */
export const getRecycleHistory = async ({
  type,
  itemId,
  actions,
  page = 1,
  limit = 20,
  fromDate,
  toDate,
  search = "",
  sortBy = "timestamp_desc",
}) => {
  const skip = (page - 1) * limit;
  const query = {};

  /* ------------------------------------------------------
     TYPE FILTER
  ------------------------------------------------------ */
  if (type) query.type = type.toLowerCase();
  if (itemId) query.itemId = String(itemId);

  /* ------------------------------------------------------
     ACTION FILTER (deleted/restored)
     DB ONLY stores:
     - deleted (isActive = true)
     - restored (isActive = false)
  ------------------------------------------------------ */
  if (Array.isArray(actions) && actions.length > 0) {
    const actionList = [];

    if (actions.includes("deleted")) actionList.push("deleted");
    if (actions.includes("restored")) actionList.push("restored");

    if (actionList.length > 0) {
      query.action = { $in: actionList };

      // deleted logs only: must be active
      if (actionList.includes("deleted") && !actionList.includes("restored")) {
        query.isActive = true;
      }

      // restored logs only: always inactive
      if (actionList.includes("restored") && !actionList.includes("deleted")) {
        query.isActive = false;
      }

      // both → remove isActive filter
      if (actionList.includes("deleted") && actionList.includes("restored")) {
        delete query.isActive;
      }
    }
  } else {
    // No action filter = show everything
    delete query.action;
    delete query.isActive;
  }

  /* ------------------------------------------------------
     DATE RANGE FILTER
  ------------------------------------------------------ */
  if (fromDate || toDate) {
    query.timestamp = {};
    if (fromDate) query.timestamp.$gte = new Date(fromDate);
    if (toDate) query.timestamp.$lte = new Date(toDate);
  }

  /* ------------------------------------------------------
     SEARCH
  ------------------------------------------------------ */
  if (search.trim()) {
    const regex = { $regex: search.trim(), $options: "i" };

    query.$or = [
      { itemId: regex },
      ...SNAPSHOT_FIELDS.map((field) => ({ [field]: regex })),
      ...ACTOR_FIELDS.map((field) => ({ [field]: regex })),
    ];
  }

  /* ------------------------------------------------------
     SORTING
  ------------------------------------------------------ */
  const sort = SORT_MAP[sortBy] || SORT_MAP.timestamp_desc;

  /* ------------------------------------------------------
     EXECUTE PARALLEL QUERIES
  ------------------------------------------------------ */
  const [logs, total] = await Promise.all([
    RecycleHistory.find(query).sort(sort).skip(skip).limit(limit).lean(),
    RecycleHistory.countDocuments(query),
  ]);

  /* ------------------------------------------------------
     RESPONSE MAPPING
  ------------------------------------------------------ */
  const items = logs.map((log) => ({
    _id: log._id,
    itemId: log.itemId,
    type: log.type,
    action: log.action,
    timestamp: log.timestamp,
    deletedAt: log.deletedAt || null,
    snapshot: log.snapshot || {},
    performedBy: {
      name: log.performedBySnapshot?.name || "System",
      email: log.performedBySnapshot?.email || "-",
      role: log.performedBySnapshot?.role || "-",
    },
  }));

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};
