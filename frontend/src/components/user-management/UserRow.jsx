import React from "react";
import { Pencil, Trash2, CheckCircle, XCircle, Eye } from "lucide-react"; // 🔑 Added Eye icon

/* ===========================================================
    FORMATTERS
=========================================================== */
const formatRole = (role) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "N/A";

const formatStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A";

/* ===========================================================
    USER ROW (for table injection)
 * @param {object} user - The user object data.
 * @param {function} onEdit - Callback for edit action.
 * @param {function} onDelete - Callback for delete action.
 * @param {function} onView - 🔑 NEW: Callback for view details action.
 * @param {boolean} isSelected - Whether the row is currently selected.
 * @param {function} onSelect - Handler to toggle row selection.
=========================================================== */
const UserRow = ({ user, onEdit, onDelete, onView, isSelected, onSelect }) => {
  const role = formatRole(user.role);
  const statusLabel = formatStatus(user.status);
  const isUserActive = user.status === "active";

  // Determine row style based on selection
  const rowClasses = `border-b hover:bg-gray-50 transition-colors duration-150 ${
    isSelected ? "bg-blue-50/70" : "bg-white"
  }`;

  return (
    <tr className={rowClasses}>
      {/* 1. Selection Checkbox */}
      <td className="py-3 px-3 w-16 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user._id)} // Pass ID to the selection handler
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          aria-label={`Select user ${user.name}`}
        />
      </td>

      {/* 2. User ID (Backend Identifier/Primary Key) */}
      {/* 🔑 Changed alignment to 'text-left' for consistency */}
      <td className="py-3 px-3 w-32 min-w-[100px] text-gray-500 text-sm text-left">
        {user._id ? user._id.slice(-4) : "-"}{" "}
      </td>

      {/* 3. Name */}
      {/* 🔑 Changed alignment to 'text-left' for consistency (Same starting point) */}
      <td
        className="py-3 px-3 w-40 min-w-[150px] font-medium text-gray-800 truncate text-left"
        title={user.name}
      >
        {user.name || "-"}
      </td>

      {/* 4. Role */}
      <td className="py-3 px-3 w-28 min-w-[90px] text-center font-semibold text-blue-700">
        {role}
      </td>

      {/* 5. Status */}
      <td className="py-3 px-3 w-28 min-w-[90px] text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isUserActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
          title={`User status: ${statusLabel}`}
        >
          {isUserActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {statusLabel}
        </span>
      </td>

      {/* 6. Email */}
      {/* 🔑 Changed alignment to 'text-left' for consistency (Same starting point) */}
      <td
        className="py-3 px-3 w-72 min-w-[280px] break-all text-sm text-gray-600 text-left"
        title={user.email}
      >
        {user.email || "-"}
      </td>

      {/* 7. Actions (Sticky Right) */}
      <td className="py-3 px-3 w-28 min-w-[90px] text-center sticky right-0 bg-white">
        <div className="flex items-center justify-center gap-2">
          {/* 🔑 NEW: View Button */}
          <button
            onClick={() => onView(user)}
            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={`View details for ${user.name}`}
            aria-label={`View details for ${user.name}`}
          >
            <Eye size={18} />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            title={`Edit ${user.name}`}
            aria-label={`Edit ${user.name}`}
          >
            <Pencil size={18} />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            title={`Delete ${user.name}`}
            aria-label={`Delete ${user.name}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserRow;
