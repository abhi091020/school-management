import React from "react";

const ProgressBar = ({
  value,
  max,
  color = "bg-blue-600", // Default color for safety
  label,
  showPercent = true,
}) => {
  // 1. Calculate raw percentage, handling division by zero
  const rawPercent = max > 0 ? (value / max) * 100 : 0;

  // 2. Ensure percent is between 0 and 100 before rounding
  const safePercent = Math.min(100, Math.max(0, rawPercent));
  const percent = Math.round(safePercent);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700 font-semibold">{label}</span>
        {showPercent && (
          <span className="text-slate-600 font-bold">{percent}%</span>
        )}
      </div>

      {/* Progress Bar Track */}
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
        {/* Progress Bar Fill */}
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
          // Optional: Add aria attributes for accessibility
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default React.memo(ProgressBar);
