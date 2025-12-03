import React from "react";
import { Info, Loader } from "lucide-react"; // Import icons

/**
 * SelectField Component
 * Renders a standard <select> dropdown with support for loading states and validation feedback.
 *
 * @param {string} label - The label for the select field.
 * @param {string} name - The HTML name attribute.
 * @param {any} value - The current controlled value.
 * @param {function} onChange - The change handler function (receives only the value).
 * @param {boolean} [required=false] - Whether the field is required.
 * @param {Array<Object>} [options=[]] - Array of options: [{ value: 'v', label: 'L' }].
 * @param {boolean} [loading=false] - Whether options are currently being fetched.
 * @param {string} [error=''] - The validation error message.
 * @param {string} [description=''] - Optional helper text/hint below the select.
 * @param {string} [placeholder='Select'] - Custom text for the default empty option.
 */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  required = false,
  options = [],
  loading = false,
  error = "",
  description = "", // 🔑 Added support for optional helper text
  placeholder = "Select", // 🔑 Added placeholder option
}) => {
  const baseClasses =
    "w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 appearance-none";

  const errorClasses = error
    ? "border-2 border-red-500 focus:ring-red-500"
    : "border border-gray-300 focus:ring-blue-500 hover:border-blue-300";

  const loadingClasses = loading
    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
    : "bg-white text-gray-800";

  const handleChange = (e) => {
    // Only call onChange if it exists and the component is not loading
    if (onChange && !loading) {
      onChange(e.target.value);
    }
  };

  const defaultOptionLabel = loading ? "Loading options..." : placeholder;

  // Conditionally show a loading indicator inside the field when loading is true
  const selectStyle = loading
    ? { backgroundImage: "none", paddingRight: "36px" } // Remove default arrow if showing loader
    : {};

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          // Ensure value is controlled; use empty string if null/undefined
          value={value ?? ""}
          onChange={handleChange}
          disabled={loading}
          className={`${baseClasses} ${errorClasses} ${loadingClasses}`}
          style={selectStyle}
        >
          {/* Default/Placeholder Option */}
          <option value="" disabled={required && !value}>
            {defaultOptionLabel}
          </option>

          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 🔑 Loading Icon Overlay */}
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Loader size={18} className="animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {error && (
        <p
          role="alert"
          className="mt-1 text-sm text-red-600 flex items-center gap-1"
        >
          <Info size={14} className="flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Optional Description/Helper Text */}
      {!error && description && (
        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          {description}
        </p>
      )}
    </div>
  );
};

export default SelectField;
