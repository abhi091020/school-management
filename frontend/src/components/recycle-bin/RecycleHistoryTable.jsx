// frontend/src/components/recycle-bin/RecycleHistoryTable.jsx

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { fetchRecycleHistory } from "../../lib/api/recycleBin";

/* ============================================================================
   Debounce Hook
============================================================================ */
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* ============================================================================
   Format Date Helper
============================================================================ */
const formatDateTime = (date) => {
  if (!date) return "Unknown";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/* ============================================================================
   VALID TYPES
============================================================================ */
const TYPE_OPTIONS = [
  "all",
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
   VALID ACTIONS
============================================================================ */
const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "deleted", label: "Deleted" },
  { value: "restored", label: "Restored" },
  { value: "permanently_deleted", label: "Permanently Deleted" },
];

/* ============================================================================
   ACTION BADGE STYLES
============================================================================ */
const ACTION_STYLES = {
  deleted: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: "🗑️",
  },
  restored: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "✅",
  },
  permanently_deleted: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    icon: "💀",
  },
};

/* ============================================================================
   MAIN COMPONENT
============================================================================ */
export default function RecycleHistoryTable({ tabType = "history" }) {
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [loading, setLoading] = useState(false);

  /* Filters */
  const [typeFilter, setTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [itemId, setItemId] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  const abortRef = useRef(null);

  const handleFilter = useCallback((setter, value) => {
    setter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  /* ============================================================================
    Final Type Logic
  ============================================================================ */
  const finalType = useMemo(() => {
    if (typeFilter && typeFilter !== "all") return typeFilter;
    if (tabType === "history") return undefined;
    return tabType;
  }, [typeFilter, tabType]);

  /* ============================================================================
    Query Params
  ============================================================================ */
  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      type: finalType || undefined,
      itemId: itemId || undefined,
      action: actionFilter || undefined,
      search: debouncedSearch || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy: "timestamp_desc",
    }),
    [
      pagination.page,
      pagination.limit,
      finalType,
      itemId,
      actionFilter,
      debouncedSearch,
      fromDate,
      toDate,
    ]
  );

  /* ============================================================================
    Loader
  ============================================================================ */
  const loadData = useCallback(async () => {
    // 1. Abort any previous pending request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetchRecycleHistory(
        queryParams,
        abortRef.current.signal
      );

      // 2. Only update state if the signal was NOT aborted during the fetch
      if (!abortRef.current.signal.aborted) {
        setRecords(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      // 3. Gracefully handle CanceledError
      // Check for common cancellation properties (AbortError name, Axios codes, custom messages)
      const isCanceled =
        err.name === "AbortError" ||
        err.message === "canceled" ||
        err.code === "ERR_CANCELED";

      if (isCanceled) {
        // Ignore the expected cancellation error
        // console.log("History fetch canceled by user action/cleanup.");
        return;
      }

      // 4. Handle genuine errors
      console.error("History load error:", err);
      toast.error("Failed to load recycle history");
    } finally {
      // 5. Only set loading to false if the request was not aborted (i.e., it completed successfully or failed genuinely)
      // Note: If an unhandled error occurred, the function already returned or exited, but it's safer to check.
      if (!abortRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [queryParams]);

  useEffect(() => {
    loadData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadData]);

  /* ============================================================================
    Helpers
  ============================================================================ */
  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const formatActor = (record) => {
    const a = record.performedBy || {};
    return a.name ? `${a.name} (${a.email || "-"})` : "System";
  };

  const getActionStyle = (action) => {
    return ACTION_STYLES[action] || ACTION_STYLES.deleted;
  };

  const resetFilters = () => {
    setTypeFilter("");
    setActionFilter("");
    setSearch("");
    setItemId("");
    setFromDate("");
    setToDate("");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  /* ============================================================================
    UI
  ============================================================================ */
  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Search actor, email, name..."
            className="border px-3 py-2 rounded-md w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(e) => handleFilter(setSearch, e.target.value)}
            aria-label="Search history"
          />

          <input
            type="text"
            placeholder="Item ID..."
            className="border px-3 py-2 rounded-md w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={itemId}
            onChange={(e) => handleFilter(setItemId, e.target.value)}
            aria-label="Filter by item ID"
          />

          {/* Type Filter */}
          <select
            className="border px-3 py-2 rounded-md w-44 focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => handleFilter(setTypeFilter, e.target.value)}
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            className="border px-3 py-2 rounded-md w-52 focus:ring-2 focus:ring-blue-500"
            value={actionFilter}
            onChange={(e) => handleFilter(setActionFilter, e.target.value)}
            aria-label="Filter by action"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Dates */}
          <input
            type="date"
            className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
            value={fromDate}
            onChange={(e) => handleFilter(setFromDate, e.target.value)}
            title="From Date"
            aria-label="From date"
          />

          <input
            type="date"
            className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
            value={toDate}
            onChange={(e) => handleFilter(setToDate, e.target.value)}
            title="To Date"
            aria-label="To date"
          />

          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
            aria-label="Reset filters"
          >
            🔄 Reset
          </button>
        </div>

        {/* Results Summary */}
        {!loading && records.length > 0 && (
          <div className="text-sm text-gray-600 pt-2 border-t">
            Showing {records.length} of {pagination.total} history records
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border rounded-lg bg-white shadow-sm p-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : records.length === 0 ? (
          <div className="border rounded-lg bg-white shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No History Records Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        ) : (
          records.map((r) => {
            const open = expandedId === r._id;
            const actionStyle = getActionStyle(r.action);

            return (
              <div
                key={r._id}
                className="border rounded-lg bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(r._id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(r._id);
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={clsx(
                          "uppercase px-2.5 py-1 rounded text-xs font-bold",
                          actionStyle.bg,
                          actionStyle.text
                        )}
                      >
                        {actionStyle.icon} {r.action.replace("_", " ")}
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
                        {r.type}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-semibold">Timestamp:</span>{" "}
                        {formatDateTime(r.timestamp)}
                      </div>
                      <div>
                        <span className="font-semibold">Performed By:</span>{" "}
                        {formatActor(r)}
                      </div>
                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                        ID: {r.itemId.slice(0, 24)}
                        {r.itemId.length > 24 && "..."}
                      </div>
                    </div>
                  </div>

                  <button
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm ml-4"
                    aria-label={open ? "Hide details" : "Show details"}
                  >
                    {open ? "▲ Hide" : "▼ Details"}
                  </button>
                </div>

                {open && (
                  <div className="p-4 border-t bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="mb-3">
                      <h4 className="text-sm font-bold text-gray-700 mb-1">
                        📋 Complete Information
                      </h4>
                      <p className="text-xs text-gray-600">
                        Full audit trail and snapshot data
                      </p>
                    </div>

                    {/* Key Information */}
                    <div className="bg-white rounded-lg p-3 mb-3 border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="border-b border-gray-100 pb-2">
                          <span className="font-semibold text-gray-700">
                            Item ID:
                          </span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">
                            {r.itemId}
                          </span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                          <span className="font-semibold text-gray-700">
                            Type:
                          </span>
                          <span className="ml-2 text-gray-900 uppercase">
                            {r.type}
                          </span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                          <span className="font-semibold text-gray-700">
                            Action:
                          </span>
                          <span className="ml-2 text-gray-900 capitalize">
                            {r.action.replace("_", " ")}
                          </span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                          <span className="font-semibold text-gray-700">
                            Actor:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {formatActor(r)}
                          </span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                          <span className="font-semibold text-gray-700">
                            Timestamp:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {formatDateTime(r.timestamp)}
                          </span>
                        </div>

                        {r.deletedAt && (
                          <div className="border-b border-gray-100 pb-2">
                            <span className="font-semibold text-gray-700">
                              Deleted At:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {formatDateTime(r.deletedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full JSON Snapshot */}
                    <details className="cursor-pointer">
                      <summary className="text-xs font-semibold text-gray-700 mb-2 hover:text-blue-600">
                        🔍 View Full JSON Snapshot
                      </summary>
                      <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto max-h-96 mt-2 whitespace-pre-wrap break-words">
                        {JSON.stringify(r.snapshot || {}, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
          <button
            disabled={pagination.page <= 1 || loading}
            className={clsx(
              "px-5 py-2 rounded-md transition-colors font-medium",
              pagination.page <= 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="text-xs text-gray-500">
              {pagination.total} total records
            </div>
          </div>

          <button
            disabled={pagination.page >= pagination.pages || loading}
            className={clsx(
              "px-5 py-2 rounded-md transition-colors font-medium",
              pagination.page >= pagination.pages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
