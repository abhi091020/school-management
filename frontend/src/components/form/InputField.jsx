import React, { useMemo } from "react";
import { Info } from "lucide-react"; // Import Info icon for description/hint

/**
 * InputField Component
 * Renders a customizable text input or textarea with built-in validation feedback.
 *
 * @param {string} label - The label for the input field.
 * @param {string} name - The HTML name attribute.
 * @param {any} value - The current controlled value.
 * @param {function} onChange - The change handler function.
 * @param {string} [type='text'] - The HTML input type.
 * @param {boolean} [required=false] - Whether the field is required.
 * @param {string} [placeholder=''] - The input placeholder.
 * @param {boolean} [disabled=false] - Whether the field is disabled.
 * @param {any} [defaultValue] - The default uncontrolled value.
 * @param {string} [error=''] - The validation error message.
 * @param {boolean} [isTextArea=false] - Renders a textarea instead of an input.
 * @param {number} [rows=3] - Number of rows for the textarea.
 * @param {string} [description=''] - Optional helper text/hint below the input.
 */
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  disabled = false,
  defaultValue,
  error = "",
  isTextArea = false, // 🔑 Added support for textarea
  rows = 3, // 🔑 Added rows prop for textarea
  description = "", // 🔑 Added support for optional helper text
  ...rest // Catch any other standard HTML props (min, max, etc.)
}) => {
  // Memoize input classes to prevent unnecessary recalculations
  const inputClasses = useMemo(() => {
    const baseClasses =
      "w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 appearance-none";

    const errorClasses = error
      ? "border-2 border-red-500 focus:ring-red-500"
      : "border border-gray-300 focus:ring-blue-500 hover:border-blue-300";

    const disabledClasses = disabled
      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-800";

    // Adjust height/resize for textarea
    const textAreaClasses = isTextArea ? "resize-y" : "";

    return `${baseClasses} ${errorClasses} ${disabledClasses} ${textAreaClasses}`;
  }, [error, disabled, isTextArea]);

  // Prepare common props for both input and textarea
  const commonProps = {
    name,
    placeholder,
    disabled,
    className: inputClasses,
    required,
    // Controlled vs. Uncontrolled handling (use value/onChange if provided, otherwise defaultValue)
    ...(onChange
      ? { value: value ?? "", onChange }
      : { defaultValue: defaultValue ?? value ?? "" }),
    ...rest,
  };

  const InputComponent = isTextArea ? "textarea" : "input";

  // Specific props for the input component
  const specificProps = isTextArea ? { rows } : { type };

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <InputComponent id={name} {...commonProps} {...specificProps} />

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

export default InputField;
