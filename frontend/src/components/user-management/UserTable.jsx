import React from "react";
import { Loader } from "lucide-react";
import UserRow from "./UserRow";

/* ===========================================================
    USER TABLE (Enterprise-grade, stable, backend-aligned)
=========================================================== */
const UserTable = ({
  users = [],
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onDelete,
  onBulkDelete,
  onView, // 🔑 ACCEPT the new onView prop
  loading = false,
}) => {
  // Check if all *visible* users are selected
  const allSelected = selectedIds.length === users.length && users.length > 0;

  /* -----------------------------------------------------------
    Select an individual user
  ----------------------------------------------------------- */
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  /* -----------------------------------------------------------
    Select all rows
  ----------------------------------------------------------- */
  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      // Select all IDs currently displayed in the table
      onSelectionChange(users.map((u) => u._id));
    }
  };

  /* -----------------------------------------------------------
    RENDER
  ----------------------------------------------------------- */
  return (
    <div className="bg-white rounded-xl shadow-lg p-0 border border-gray-100">
      {/* Bulk Delete Bar (Sticky) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 mb-0 flex justify-between items-center bg-red-50 border-b border-red-200 rounded-t-xl px-4 py-3 shadow-sm">
          <span className="font-semibold text-red-700">
            {selectedIds.length} selected
          </span>

          <button
            onClick={onBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full table-auto min-w-[900px] text-gray-700">
          {/* Table Header (Sticky) */}
          <thead className="bg-gray-100 uppercase text-xs text-gray-600 sticky top-0 z-10 border-b">
            <tr>
              {/* Checkbox column (Width must match UserRow) */}
              <th className="py-3 px-3 w-16 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>

              {/* Column definitions matching UserRow structure */}
              <th className="py-3 px-3 w-32 text-left">User ID</th>
              <th className="py-3 px-3 w-40 text-left">Name</th>
              <th className="py-3 px-3 w-28 text-center">Role</th>
              <th className="py-3 px-3 w-28 text-center">Status</th>
              <th className="py-3 px-3 w-72 text-left">Email</th>

              {/* Actions column (Sticky right for visibility) */}
              <th className="py-3 px-3 w-28 text-center sticky right-0 bg-gray-100">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading state
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center text-blue-500">
                    <Loader className="animate-spin mr-3" size={20} />
                    Fetching user data...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-gray-400 font-medium"
                >
                  No users match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              // User rows
              users.map((user) => (
                <UserRow
                  key={user._id}
                  user={user}
                  isSelected={selectedIds.includes(user._id)}
                  onSelect={toggleSelect} // Individual selection handler
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView} // 🔑 PASS the onView prop to UserRow
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
