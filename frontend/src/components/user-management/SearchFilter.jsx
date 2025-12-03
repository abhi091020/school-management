import React from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa"; // Import icons for better UX

/* ===========================================================
    ROLE FILTER OPTIONS — matches backend roles
=========================================================== */
const ROLE_OPTIONS = [
  { label: "All Users", value: "all" }, // Changed label for clarity
  { label: "Students", value: "student" }, // Changed label for clarity
  { label: "Teachers", value: "teacher" }, // Changed label for clarity
  { label: "Parents", value: "parent" }, // Changed label for clarity
  { label: "Admins", value: "admin" }, // Changed label for clarity
];

/**
 * SearchFilter Component
 * Handles role filtering and displays contextual action buttons (Add, Bulk Delete).
 */
const SearchFilter = ({
  filterRole,
  setFilterRole,
  openAddUserModal,
  onBulkDelete,
  selectedCount,
}) => {
  // Determine the context for the "Add User" button
  const addUserText =
    filterRole === "student"
      ? "Add Student"
      : filterRole === "teacher"
      ? "Add Teacher"
      : filterRole === "admin"
      ? "Add Staff/Admin"
      : filterRole === "parent"
      ? "Add Parent"
      : "Add New User";

  // Determine the color for the filter buttons
  const getFilterButtonClasses = (value) =>
    `px-4 py-2 rounded-lg font-semibold transition-colors duration-200 
     ${
       filterRole === value
         ? "bg-blue-600 text-white shadow-md"
         : "bg-gray-100 text-gray-700 hover:bg-gray-200"
     } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 p-4 bg-white shadow-sm rounded-xl border">
      {/* 1. Role Filter Buttons */}
      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
        {ROLE_OPTIONS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterRole(item.value)}
            className={getFilterButtonClasses(item.value)}
            // Accessibility
            aria-pressed={filterRole === item.value}
            aria-label={`Filter users by ${item.label}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 2. Action Buttons (Bulk Delete & Add User) */}
      <div className="flex gap-3 flex-wrap justify-center sm:justify-end">
        {/* Bulk Delete Button (Contextual) */}
        {selectedCount > 0 && (
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Delete ${selectedCount} selected users`}
          >
            <FaTrashAlt />
            Delete Selected ({selectedCount})
          </button>
        )}

        {/* Add User Button (Contextual Text) */}
        <button
          onClick={() => openAddUserModal(filterRole)} // Pass filterRole for contextual modal initialization
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={addUserText}
        >
          <FaPlus />
          {addUserText}
        </button>
      </div>
    </div>
  );
};

export default SearchFilter;
