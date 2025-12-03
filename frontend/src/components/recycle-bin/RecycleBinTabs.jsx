"use client";

import { memo, useCallback, useRef } from "react";
import clsx from "clsx";

/* ============================================================================
   BACKEND-ALIGNED MODULE TYPES (STRICT)
   Includes "user" + "admin" separately
============================================================================ */
export const MODULE_TABS = Object.freeze([
  { label: "Users", value: "user" },
  { label: "Admins", value: "admin" },
  { label: "Students", value: "student" },
  { label: "Parents", value: "parent" },
  { label: "Teachers", value: "teacher" },
  { label: "Classes", value: "class" },
  { label: "Subjects", value: "subject" },
  { label: "Attendance", value: "attendance" },
  { label: "Exams", value: "exam" },
  { label: "Marks", value: "mark" },
  { label: "Timetables", value: "timetable" },
  { label: "Fees", value: "fee" },
  { label: "Notifications", value: "notification" },
  { label: "Feedback", value: "feedback" },

  // History logs combined view
  { label: "History Logs", value: "history" },
]);

/* ============================================================================
   Recycle Bin Tabs Component
============================================================================ */
function RecycleBinTabs({ selected, onChange, className = "" }) {
  const containerRef = useRef(null);

  const handleSelect = useCallback(
    (value) => {
      if (value !== selected) onChange(value);
    },
    [selected, onChange]
  );

  /* ============================================================================
     Keyboard Navigation
  ============================================================================ */
  const onKeyDown = useCallback(
    (event) => {
      const index = MODULE_TABS.findIndex((t) => t.value === selected);
      if (index < 0) return;

      let targetIndex = index;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          targetIndex = (index + 1) % MODULE_TABS.length;
          break;

        case "ArrowLeft":
          event.preventDefault();
          targetIndex = (index - 1 + MODULE_TABS.length) % MODULE_TABS.length;
          break;

        default:
          return;
      }

      const nextTab = MODULE_TABS[targetIndex];
      handleSelect(nextTab.value);

      const tabList = containerRef.current?.querySelectorAll("[role='tab']");
      tabList?.[targetIndex]?.focus();
    },
    [selected, handleSelect]
  );

  return (
    <div
      className={clsx(
        "w-full border-b border-gray-300 mb-4 overflow-x-auto overflow-y-hidden",
        className
      )}
    >
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Recycle Bin Tabs"
        className="flex gap-2 min-w-max py-2 px-1"
        onKeyDown={onKeyDown}
      >
        {MODULE_TABS.map((tab) => {
          const isActive = tab.value === selected;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.value)}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(RecycleBinTabs);
