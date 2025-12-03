// frontend/src/components/recycle-bin/ConfirmationModal.jsx

"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

/**
 * Production-ready Confirmation Modal
 * Replaces window.confirm() with accessible, user-friendly dialog
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'success'
  itemDetails = null, // Optional: Show item preview
  loading = false,
}) {
  /* ============================================================================
     ESCAPE KEY HANDLER
  ============================================================================ */
  const handleEscape = useCallback(
    (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    },
    [loading, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  /* ============================================================================
     VARIANT STYLES
  ============================================================================ */
  const variantStyles = {
    danger: {
      icon: "🗑️",
      iconBg: "bg-red-100",
      iconText: "text-red-600",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    },
    warning: {
      icon: "⚠️",
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    },
    success: {
      icon: "✅",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      button: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div
              className={clsx(
                "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                style.iconBg,
                style.iconText
              )}
            >
              {style.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                id="modal-title"
                className="text-lg font-bold text-gray-900 mb-2"
              >
                {title}
              </h3>
              <p id="modal-description" className="text-sm text-gray-600">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Item Details Preview (Optional) */}
        {itemDetails && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Item Details:
              </h4>
              <div className="space-y-1 text-sm">
                {Object.entries(itemDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-gray-600 font-medium capitalize">
                      {key}:
                    </span>
                    <span className="text-gray-900 font-semibold truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md",
              "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-white rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2",
              style.button
            )}
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// CSS for animation (add to your global CSS or tailwind config)
// @keyframes scale-in {
//   0% { opacity: 0; transform: scale(0.95); }
//   100% { opacity: 1; transform: scale(1); }
// }
// .animate-scale-in { animation: scale-in 0.2s ease-out; }
