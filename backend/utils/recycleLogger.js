// backend/utils/recycleLogger.js
// Production-ready audit logger (NO duplicate logs, NO "all" type)
// Only logs a single entry per delete/restore/permanent delete.
//
// Key rules:
//  - deleted → logs one entry (type = actual type only)
//  - restored → logs one entry (action = restored)
//  - permanently_deleted → logs one entry (action = permanently_deleted)
//  - performedBySnapshot always correct
//  - safe deep clone for snapshot
//  - session aware

import RecycleHistory from "../models/admin/RecycleHistory.js";
import {
  buildActorSnapshot as buildActorSnapshotUtil,
  normalizeSnapshot as normalizeSnapshotUtil,
} from "./recycleUtils.js";

/* -------------------------------------------------------------------------- */
/* Deep Clone (safe for ObjectId, Date, nested structures)                     */
/* -------------------------------------------------------------------------- */
const deepClone = (v, visited = new WeakMap()) => {
  if (v === null || typeof v !== "object") return v;

  if (v instanceof Date) return new Date(v.getTime());
  if (v?._bsontype === "ObjectId") return String(v);

  if (visited.has(v)) return visited.get(v);

  if (Array.isArray(v)) {
    const arr = [];
    visited.set(v, arr);
    for (const item of v) arr.push(deepClone(item, visited));
    return arr;
  }

  const obj = {};
  visited.set(v, obj);

  for (const key in v) {
    if (Object.prototype.hasOwnProperty.call(v, key)) {
      obj[key] = deepClone(v[key], visited);
    }
  }
  return obj;
};

/* -------------------------------------------------------------------------- */
/* logRecycleEvent                                                             */
/* Only ONE log per event — NO duplicate “all” logs                           */
/* -------------------------------------------------------------------------- */
export const logRecycleEvent = async ({
  itemId,
  type,
  action,
  performedBy = null,
  snapshot = null,
  session = null,
}) => {
  try {
    if (!itemId || !type || !action) return;

    const lowerType = String(type).toLowerCase();
    const safeItemId = String(itemId);
    const now = new Date();
    const isDeleted = action === "deleted";

    const dbOptions = session ? { session } : {};

    /* ----------------------------------------------------------------------
       RESTORE → Disable "deleted" logs of that item/type
    ---------------------------------------------------------------------- */
    if (action === "restored") {
      await RecycleHistory.updateMany(
        {
          itemId: safeItemId,
          action: "deleted",
          isActive: true,
          type: lowerType,
        },
        { $set: { isActive: false } },
        dbOptions
      );
    }

    /* ----------------------------------------------------------------------
       Actor Snapshot
    ---------------------------------------------------------------------- */
    const actorSnapshot = performedBy
      ? buildActorSnapshotUtil(performedBy)
      : { name: "System", email: "-", role: "-" };

    const performerId =
      performedBy && performedBy._id
        ? String(performedBy._id)
        : performedBy
        ? String(performedBy)
        : null;

    /* ----------------------------------------------------------------------
       Snapshot (ONLY for deletes)
    ---------------------------------------------------------------------- */
    let safeSnapshot = null;

    if (snapshot && isDeleted) {
      const normalized = normalizeSnapshotUtil(snapshot);
      safeSnapshot = deepClone(normalized);
    }

    /* ----------------------------------------------------------------------
       Main Log Entry (1 entry only)
    ---------------------------------------------------------------------- */
    const payload = {
      itemId: safeItemId,
      type: lowerType,
      action,
      performedBy: performerId,
      performedBySnapshot: actorSnapshot,
      snapshot: safeSnapshot,
      timestamp: now,
      deletedAt: isDeleted ? now : null,
      isActive: isDeleted, // only delete logs have active=true
    };

    await RecycleHistory.create([payload], dbOptions);
  } catch (err) {
    console.error("Recycle Logger Error:", err);
  }
};

/* -------------------------------------------------------------------------- */
/* Export Helpers                                                               */
/* -------------------------------------------------------------------------- */
export const buildActorSnapshot = buildActorSnapshotUtil;
export const normalizeSnapshot = normalizeSnapshotUtil;
