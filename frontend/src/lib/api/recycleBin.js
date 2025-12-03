// frontend/src/lib/api/recycleBin.js

import axios from "../../api/axiosInstance";

/* ============================================================================
   ALLOWED TYPES - REMOVED "all"
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
   ABORT CONTROLLERS
============================================================================ */
let fetchAbort = null;
let historyAbort = null;

/* ============================================================================
   1. FETCH DELETED ITEMS
============================================================================ */
export const fetchDeletedItems = async (params = {}, externalSignal) => {
  if (fetchAbort) fetchAbort.abort();
  fetchAbort = new AbortController();
  const signal = externalSignal || fetchAbort.signal;

  const type = String(params.type || "")
    .trim()
    .toLowerCase();
  if (!type) throw new Error("Missing required: type");
  if (!ALLOWED_TYPES.includes(type))
    throw new Error(`Unsupported recycle-bin type: ${type}`);

  const response = await axios.get("/api/admin/recycle-bin", {
    params: {
      type,
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search || "",
      sortBy: params.sortBy || "deletedAt_desc",
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
    },
    signal,
  });

  return {
    items: response.data.data || [],
    pagination: response.data.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  };
};

/* ============================================================================
   2. RESTORE ITEMS
============================================================================ */
export const restoreItems = async (type, ids) => {
  const cleanType = String(type || "")
    .trim()
    .toLowerCase();
  if (!cleanType) throw new Error("Missing required: type");
  if (!ALLOWED_TYPES.includes(cleanType))
    throw new Error(`Unsupported recycle-bin type: ${cleanType}`);

  if (!Array.isArray(ids) || ids.length === 0)
    throw new Error("restoreItems requires a non-empty ids[]");

  const response = await axios.post(
    "/api/admin/recycle-bin/restore",
    { type: cleanType, ids },
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
};

/* ============================================================================
   3. HARD DELETE ITEMS
============================================================================ */
export const hardDeleteItems = async (type, ids) => {
  const cleanType = String(type || "")
    .trim()
    .toLowerCase();
  if (!cleanType) throw new Error("Missing required: type");
  if (!ALLOWED_TYPES.includes(cleanType))
    throw new Error(`Unsupported recycle-bin type: ${cleanType}`);

  if (!Array.isArray(ids) || ids.length === 0)
    throw new Error("hardDeleteItems requires a non-empty ids[]");

  const response = await axios.delete("/api/admin/recycle-bin/hard-delete", {
    data: { type: cleanType, ids },
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
};

/* ============================================================================
   4. FETCH RECYCLE HISTORY
============================================================================ */
export const fetchRecycleHistory = async (
  params = {},
  externalSignal = null
) => {
  if (historyAbort) historyAbort.abort();
  historyAbort = new AbortController();

  const signal = externalSignal || historyAbort.signal;

  const response = await axios.get("/api/admin/recycle-history", {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
      type: params.type || undefined,
      itemId: params.itemId || undefined,
      action: params.action || undefined,
      search: params.search || "",
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      sortBy: params.sortBy || "timestamp_desc",
    },
    signal,
  });

  return {
    data: response.data.data || [],
    pagination: response.data.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      pages: 1,
    },
  };
};
