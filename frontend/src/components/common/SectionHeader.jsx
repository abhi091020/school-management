import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaArrowRight,
} from "react-icons/fa";

// --- START: Status Badges (StatusBadge, PriorityBadge) ---

// Assuming ATTENDANCE_STATUS is defined elsewhere or mock it:
const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
};

// Status Badge (Attendance Status)
export const StatusBadge = ({ status }) => {
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

// Priority Badge
export const PriorityBadge = ({ priority }) => {
  const colors = {
    high: "bg-red-600 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-green-500 text-white",
  };

  const displayPriority = priority
    ? priority.charAt(0).toUpperCase() + priority.slice(1)
    : "N/A"; // Added fallback for display text

  return (
    <span
      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
        colors[priority] || colors.low
      } shadow-sm`}
    >
      {/* Displaying capitalized priority for better readability */}
      {displayPriority}
    </span>
  );
};

// --- END: Status Badges ---
// --- START: Section Header ---

const SectionHeader = ({
  icon: Icon,
  title,
  iconBg,
  action,
  actionLabel,
  onAction,
}) => (
  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${iconBg} shadow-md`}>
        <Icon className="text-base" />
      </div>
      {title}
    </h3>
    {action && (
      <button
        onClick={onAction}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors group"
      >
        {actionLabel}{" "}
        <FaArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
      </button>
    )}
  </div>
);

export default React.memo(SectionHeader);
