import React from "react";

// System Status Indicator
const SystemStatus = ({ label, status, value }) => {
  // Normalize status string to handle casing variations (e.g., 'Online' vs 'online')
  const normalizedStatus = status ? status.toLowerCase() : "";

  // 🚨 Status Color Mapping: Maps normalized status keys to Tailwind classes
  const statusColors = {
    up: "bg-emerald-500", // Handles 'up', 'online', 'healthy'
    success: "bg-emerald-500", // Handles 'success'
    online: "bg-emerald-500",
    warning: "bg-amber-500", // Handles 'warning', 'degraded'
    degraded: "bg-amber-500",
    down: "bg-red-500", // Handles 'down', 'offline', 'error'
    offline: "bg-red-500",
  };

  // Choose the color, falling back to gray if status is unrecognized
  const dotColorClass = statusColors[normalizedStatus] || "bg-slate-300";

  // Apply pulse only if the status implies a live, healthy connection (e.g., 'up' or 'online')
  const pulseClass =
    normalizedStatus === "online" || normalizedStatus === "up"
      ? "animate-pulse"
      : "";

  return (
    // Uses last:border-0 to clean up the border on the last item in a list
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        {/* Status Dot */}
        <span
          className={`w-2.5 h-2.5 rounded-full ${dotColorClass} ${pulseClass} flex-shrink-0`}
        />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-500">{value}</span>
    </div>
  );
};

export default React.memo(SystemStatus);
