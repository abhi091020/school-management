// frontend/src/components/recycle-bin/RecycleTable.jsx
// PRODUCTION READY - Enterprise Level UI

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import {
  fetchDeletedItems,
  restoreItems,
  hardDeleteItems,
} from "../../lib/api/recycleBin";
import ConfirmationModal from "./ConfirmationModal";

/* ============================================================================
   DEBOUNCE HOOK
============================================================================ */
const useDebounce = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ============================================================================
   FORMAT DATE
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
  });
};

/* ============================================================================
   USER TYPE BADGE COLORS
============================================================================ */
const USER_TYPE_COLORS = {
  admin: "from-purple-500 to-purple-600",
  student: "from-blue-500 to-blue-600",
  parent: "from-green-500 to-green-600",
  teacher: "from-orange-500 to-orange-600",
  user: "from-gray-500 to-gray-600",
};

/* ============================================================================
   RELEVANT FIELDS BY TYPE
============================================================================ */
const RELEVANT_FIELDS = {
  admin: ["userId", "name", "email", "phone", "role", "status"],
  student: [
    "userId",
    "name",
    "admissionNumber",
    "rollNumber",
    "classId",
    "academicYear",
    "gender",
    "dob",
    "parent",
    "parentUserId",
    "fatherName",
    "motherName",
    "city",
    "state",
  ],
  parent: [
    "userId",
    "fatherName",
    "motherName",
    "fatherPhone",
    "motherPhone",
    "children",
    "childrenUserIds",
    "occupation",
    "city",
    "state",
  ],
  teacher: [
    "userId",
    "fullName",
    "employeeId",
    "designation",
    "department",
    "personalEmail",
    "personalPhone",
    "joiningDate",
  ],
  user: ["userId", "name", "email", "phone", "role", "status"],
};

/* ============================================================================
   MAIN COMPONENT
============================================================================ */
export default function RecycleTable({ type }) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("deletedAt_desc");

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    items: [],
    loading: false,
  });

  const abortRef = useRef(null);

  /* ========================================================================== */
  /* Query Params */
  /* ========================================================================== */
  const queryParams = useMemo(
    () => ({
      type: type.toLowerCase(),
      search: debouncedSearch || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy,
      limit: pagination.limit,
    }),
    [type, debouncedSearch, fromDate, toDate, sortBy, pagination.limit]
  );

  /* ========================================================================== */
  /* Load Data */
  /* ========================================================================== */
  const loadData = useCallback(
    async (page = 1) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setLoading(true);

      try {
        const res = await fetchDeletedItems({ ...queryParams, page }, signal);

        if (!signal.aborted) {
          setItems(res.items || []);
          setPagination(res.pagination);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error("Load error:", err);
          toast.error("Failed to load deleted items");
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [queryParams]
  );

  useEffect(() => {
    setSelectedIds([]);
    setExpandedId(null);
    loadData(1);
  }, [type]);

  useEffect(() => {
    loadData(1);
  }, [debouncedSearch, fromDate, toDate, sortBy, pagination.limit]);

  /* ========================================================================== */
  /* Select Helpers */
  /* ========================================================================== */
  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    const all = items.map((i) => i.itemId);
    setSelectedIds(selectedIds.length === items.length ? [] : all);
  };

  /* ========================================================================== */
  /* RESTORE */
  /* ========================================================================== */
  const openRestoreModal = (itemIds = null) => {
    const ids = itemIds || selectedIds;
    if (!ids.length) return;

    const itemsToRestore = items.filter((i) => ids.includes(i.itemId));

    setConfirmModal({
      isOpen: true,
      type: "restore",
      items: itemsToRestore,
      loading: false,
    });
  };

  const handleRestore = async () => {
    const ids = confirmModal.items.map((i) => i.itemId);

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      await restoreItems(type, ids);
      toast.success(`✅ Restored ${ids.length} item(s) successfully`);
      await loadData(pagination.page);
      setSelectedIds([]);
      setConfirmModal({ isOpen: false, type: null, items: [], loading: false });
    } catch (err) {
      console.error("Restore error:", err);
      toast.error(err.response?.data?.message || "❌ Restore failed");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ========================================================================== */
  /* HARD DELETE */
  /* ========================================================================== */
  const openDeleteModal = (itemIds = null) => {
    const ids = itemIds || selectedIds;
    if (!ids.length) return;

    const itemsToDelete = items.filter((i) => ids.includes(i.itemId));

    setConfirmModal({
      isOpen: true,
      type: "delete",
      items: itemsToDelete,
      loading: false,
    });
  };

  const handleHardDelete = async () => {
    const ids = confirmModal.items.map((i) => i.itemId);

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      await hardDeleteItems(type, ids);
      toast.success(`🗑️ Permanently deleted ${ids.length} item(s)`);
      await loadData(pagination.page);
      setSelectedIds([]);
      setConfirmModal({ isOpen: false, type: null, items: [], loading: false });
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "❌ Delete failed");
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ========================================================================== */
  /* Display Helpers */
  /* ========================================================================== */
  const getDisplayName = useCallback((item) => {
    const s = item.snapshot || {};

    // 1. **Highest Priority (The Fix):** //    Use the name provided by the backend's listDeletedItems service (item.name).
    //    For a Student, this is the correct 'User.name'.
    if (item.name && item.name !== "-") {
      return item.name;
    }

    // 2. Fallbacks (Original logic for safety/other models):
    //    If step 1 fails, it falls back to checking various fields in the snapshot.
    return (
      s.fullName ||
      s.name ||
      s.fatherName || // This is now a lower priority, preventing the Student display error.
      s.motherName ||
      `[${item.type}] ID: ${item.itemId.slice(0, 8)}`
    );
  }, []);

  const getDisplayEmail = useCallback((item) => {
    const s = item.snapshot || {};
    return s.email || s.personalEmail || "-";
  }, []);

  const getDisplayRole = useCallback((item) => {
    return (item.type || "-").toUpperCase();
  }, []);

  const getDisplayId = useCallback((item) => {
    const s = item.snapshot || {};
    return (
      s.userId || s.admissionNumber || s.employeeId || item.itemId.slice(0, 12)
    );
  }, []);

  const getDeletedByInfo = useCallback((item) => {
    const by = item.deletedBy || {};
    if (!by.name) return "System";
    return `${by.name} (${by.role || "user"})`;
  }, []);

  const getRoleBadgeColor = useCallback((itemType) => {
    return USER_TYPE_COLORS[itemType] || USER_TYPE_COLORS.user;
  }, []);

  /* ========================================================================== */
  /* Get Relevant Fields for Display */
  /* ========================================================================== */
  const getRelevantFields = useCallback(
    (item) => {
      const snap = item.snapshot || {};
      const itemType = item.type || "user";
      const fields = RELEVANT_FIELDS[itemType] || RELEVANT_FIELDS.user;

      const relevantData = {};

      fields.forEach((field) => {
        if (snap[field] !== undefined && snap[field] !== null) {
          relevantData[field] = snap[field];
        }
      });

      // Add deletion metadata
      relevantData.deletedAt = item.deletedAt;
      relevantData.deletedBy = getDeletedByInfo(item);

      return relevantData;
    },
    [getDeletedByInfo]
  );

  /* ========================================================================== */
  /* Format Field Value */
  /* ========================================================================== */
  const formatFieldValue = (key, value) => {
    if (value === null || value === undefined) return "-";

    // Dates
    if (key === "deletedAt" || key === "dob" || key === "joiningDate") {
      return formatDateTime(value);
    }

    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return "None";
      return value.join(", ");
    }

    // Objects (like parent, children)
    if (typeof value === "object") {
      if (value._id) return value._id;
      return JSON.stringify(value);
    }

    return String(value);
  };

  /* ========================================================================== */
  /* Get Parent-Student Link Info */
  /* ========================================================================== */
  const getLinkInfo = useCallback((item) => {
    const snap = item.snapshot || {};
    const linkInfo = [];

    if (item.type === "student" && snap.parent) {
      linkInfo.push({
        label: "Parent ID",
        value: snap.parentUserId || snap.parent,
        icon: "👨‍👩‍👧",
      });
      if (snap.fatherName) {
        linkInfo.push({
          label: "Father",
          value: snap.fatherName,
          icon: "👨",
        });
      }
      if (snap.motherName) {
        linkInfo.push({
          label: "Mother",
          value: snap.motherName,
          icon: "👩",
        });
      }
    }

    if (item.type === "parent" && snap.children) {
      const childrenIds = snap.childrenUserIds || snap.children;
      linkInfo.push({
        label: "Student IDs",
        value: Array.isArray(childrenIds)
          ? childrenIds.join(", ")
          : childrenIds,
        icon: "👨‍🎓",
      });
    }

    return linkInfo;
  }, []);

  /* ========================================================================== */
  /* UI */
  /* ========================================================================== */
  return (
    <div className="w-full space-y-4">
      {/* Filters & Actions */}
      <div className="bg-white p-4 border rounded-lg shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="🔍 Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-md w-72 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="From Date"
          />

          <input
            type="date"
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="To Date"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="deletedAt_desc">📅 Newest First</option>
            <option value="deletedAt_asc">📅 Oldest First</option>
          </select>

          <select
            value={pagination.limit}
            onChange={(e) =>
              setPagination((p) => ({
                ...p,
                limit: Number(e.target.value),
                page: 1,
              }))
            }
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setFromDate("");
              setToDate("");
              setSortBy("deletedAt_desc");
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
          >
            🔄 Reset
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2 pt-3 border-t">
            <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md font-medium">
              {selectedIds.length} selected
            </span>

            <button
              onClick={() => openRestoreModal()}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 font-medium"
            >
              ✅ Restore Selected
            </button>

            <button
              onClick={() => openDeleteModal()}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 font-medium"
            >
              🗑️ Delete Forever
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Select All */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="checkbox"
              checked={selectedIds.length === items.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 cursor-pointer accent-blue-600"
            />
            <label className="text-sm font-medium text-gray-700 cursor-pointer">
              Select All ({items.length})
            </label>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-64 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🗑️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Deleted Items
            </h3>
            <p className="text-gray-500">
              Deleted {type} items will appear here.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isExpanded = expandedId === item.itemId;
            const linkInfo = getLinkInfo(item);
            const relevantFields = getRelevantFields(item);

            return (
              <div
                key={item.itemId}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.itemId)}
                      onChange={() => toggleSelect(item.itemId)}
                      className="mt-1.5 w-5 h-5 cursor-pointer accent-blue-600"
                    />

                    <div className="flex-1">
                      {/* Name & Badge */}
                      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {getDisplayName(item)}
                          </h3>
                          <span
                            className={clsx(
                              "px-2.5 py-1 bg-gradient-to-r text-white rounded-full text-xs font-bold uppercase tracking-wide",
                              getRoleBadgeColor(item.type)
                            )}
                          >
                            {getDisplayRole(item)}
                          </span>
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500 font-medium">
                            📧 Email:{" "}
                          </span>
                          <span className="text-gray-800">
                            {getDisplayEmail(item)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            🆔 ID:{" "}
                          </span>
                          <span className="text-gray-800 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {getDisplayId(item)}
                          </span>
                        </div>
                      </div>

                      {/* Parent-Student Links */}
                      {linkInfo.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
                          <h4 className="text-xs font-semibold text-blue-700 mb-2">
                            🔗 Related Records
                          </h4>
                          <div className="space-y-1">
                            {linkInfo.map((link, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span>{link.icon}</span>
                                <span className="text-blue-600 font-medium">
                                  {link.label}:
                                </span>
                                <span className="text-blue-900 font-semibold">
                                  {link.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deletion Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                        <div>
                          <span className="text-red-600 font-semibold">
                            🗑️ Deleted:{" "}
                          </span>
                          <span className="text-red-700 font-medium">
                            {formatDateTime(item.deletedAt)}
                          </span>
                        </div>
                        <div>
                          <span className="text-red-600 font-semibold">
                            👤 By:{" "}
                          </span>
                          <span className="text-red-700 font-medium">
                            {getDeletedByInfo(item)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openRestoreModal([item.itemId])}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors font-medium"
                        >
                          ✅ Restore
                        </button>

                        <button
                          onClick={() => openDeleteModal([item.itemId])}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors font-medium"
                        >
                          🗑️ Delete Forever
                        </button>

                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.itemId)
                          }
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors font-medium ml-auto"
                        >
                          {isExpanded ? "▲ Hide" : "▼ Details"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">
                      📋 Snapshot Data (Relevant Fields Only)
                    </h4>

                    <div className="bg-white rounded-lg p-3 border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {Object.entries(relevantFields).map(([key, value]) => (
                          <div
                            key={key}
                            className="border-b border-gray-100 pb-2"
                          >
                            <span className="font-semibold text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {formatFieldValue(key, value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
          <button
            disabled={pagination.page <= 1 || loading}
            className={clsx(
              "px-5 py-2 rounded-md transition-colors font-medium",
              pagination.page <= 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            onClick={() => loadData(pagination.page - 1)}
          >
            ← Previous
          </button>

          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="text-xs text-gray-500">
              {pagination.total} total
            </div>
          </div>

          <button
            disabled={pagination.page >= pagination.totalPages || loading}
            className={clsx(
              "px-5 py-2 rounded-md transition-colors font-medium",
              pagination.page >= pagination.totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            onClick={() => loadData(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            items: [],
            loading: false,
          })
        }
        onConfirm={
          confirmModal.type === "restore" ? handleRestore : handleHardDelete
        }
        title={
          confirmModal.type === "restore"
            ? "Restore Items"
            : "Permanently Delete"
        }
        message={
          confirmModal.type === "restore"
            ? `Restore ${confirmModal.items.length} item(s)? They will be moved back to their original location.`
            : `⚠️ PERMANENTLY DELETE ${confirmModal.items.length} item(s)? This CANNOT be undone!`
        }
        confirmText={
          confirmModal.type === "restore" ? "Restore" : "Delete Forever"
        }
        variant={confirmModal.type === "restore" ? "success" : "danger"}
        itemDetails={
          confirmModal.items.length === 1
            ? {
                Name: getDisplayName(confirmModal.items[0]),
                Type: getDisplayRole(confirmModal.items[0]),
                Email: getDisplayEmail(confirmModal.items[0]),
                ID: getDisplayId(confirmModal.items[0]),
              }
            : null
        }
        loading={confirmModal.loading}
      />
    </div>
  );
}
