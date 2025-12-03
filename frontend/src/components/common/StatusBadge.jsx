// src/components/common/StatusBadges.jsx (or similar file)

import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
} from "react-icons/fa";

// Mocking ATTENDANCE_STATUS as it was missing from the original file
const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
};

// --- 1. Status Badge (Attendance Status) ---
const StatusBadgeComponent = ({ status }) => {
  const config = {
    [ATTENDANCE_STATUS.PRESENT]: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      icon: FaCheckCircle,
    },
    [ATTENDANCE_STATUS.ABSENT]: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: FaTimesCircle,
    },
    [ATTENDANCE_STATUS.LATE]: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: FaExclamationCircle,
    },
    default: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      icon: FaExclamationCircle,
    },
  };
  const { bg, text, icon: Icon } = config[status] || config.default;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg} ${text} shadow-sm`}
    >
      <Icon className="text-[10px]" />
      {status}
    </span>
  );
};

// --- 2. Priority Badge ---
const PriorityBadgeComponent = ({ priority }) => {
  const colors = {
    high: "bg-red-600 text-white", // High contrast colors for priority
    medium: "bg-amber-500 text-white",
    low: "bg-green-500 text-white",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
        colors[priority] || colors.low
      } shadow-sm`}
    >
      {priority}
    </span>
  );
};

// 🚀 EXPORTS: Applying React.memo to prevent unnecessary re-renders when parent components update.

// Use named exports for memoized components (recommended style for utility exports)
export const StatusBadge = React.memo(StatusBadgeComponent);
export const PriorityBadge = React.memo(PriorityBadgeComponent);
