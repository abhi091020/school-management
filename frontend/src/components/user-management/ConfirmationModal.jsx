import React, { useEffect, useRef } from "react";
import { FaExclamationTriangle } from "react-icons/fa"; // Icon for visual clarity

/**
 * Confirmation Modal — Reusable for Delete, Update, Archive, etc.
 *
 * @param {string} message - The main confirmation message.
 * @param {function} onConfirm - Function to execute when 'Confirm' is clicked.
 * @param {function} onCancel - Function to execute when 'Cancel' or backdrop is clicked.
 * @param {string} [confirmText="Confirm"] - Text for the confirmation button.
 * @param {string} [confirmColor="bg-red-600 hover:bg-red-700"] - Tailwind classes for confirm button color.
 */
const ConfirmationModal = ({
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  confirmColor = "bg-red-600 hover:bg-red-700",
}) => {
  const modalRef = useRef(null);

  // 1. Accessibility & Keyboard Handling (Escape key to close)
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    // Auto-focus the Confirm button for keyboard accessibility (optional)
    if (modalRef.current) {
      modalRef.current.querySelector("button[data-confirm-btn]")?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [onCancel]);

  // 2. Click outside handling (closes modal when clicking backdrop)
  const handleBackdropClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) {
      onCancel();
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog" // ARIA role for modals
      aria-modal="true" // Indicates content underneath is inert
      aria-labelledby="modal-title" // Link to the title
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn transform transition-all">
        {/* Header/Icon */}
        <div className="flex flex-col items-center mb-4">
          <FaExclamationTriangle className="text-red-500 text-4xl mb-3" />
          <h3 id="modal-title" className="text-xl font-bold text-gray-900">
            Action Required
          </h3>
        </div>

        {/* Message */}
        <p className="text-gray-600 font-medium mb-6 text-center">{message}</p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200 w-full sm:w-auto font-medium order-2 sm:order-1"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${confirmColor} text-white rounded-lg transition-colors duration-200 w-full sm:w-auto font-medium order-1 sm:order-2`}
            data-confirm-btn // Used for initial focus in useEffect
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
