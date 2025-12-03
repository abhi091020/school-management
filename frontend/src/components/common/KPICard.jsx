import React from "react";
// Added FaMinus for neutral trend state
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";

// Helper function to handle trend styling
const getTrendStyling = (trend) => {
  if (trend === "up") {
    return { Icon: FaArrowUp, colorClass: "text-emerald-600" };
  }
  if (trend === "down") {
    return { Icon: FaArrowDown, colorClass: "text-red-600" };
  }
  // Default/Neutral case
  return { Icon: FaMinus, colorClass: "text-slate-500" };
};

// KPI Card (Large Stat) - Default Export
const KPICard = ({
  label,
  value,
  icon: Icon,
  gradient, // e.g., 'from-blue-500 to-indigo-600'
  trend,
  trendValue,
  delay,
  onClick,
  subValue,
}) => {
  // Use the helper to determine the correct icon and color class
  const { Icon: TrendIcon, colorClass: trendColorClass } =
    getTrendStyling(trend);

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-100 cursor-pointer overflow-hidden 
      hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-500 ease-out animate-fadeInUp`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Gradient Hover Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <div className="relative flex items-center justify-between">
        <div className="space-y-1">
          {/* Label */}
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            {label}
          </p>
          {/* Value */}
          <p className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-none py-1">
            {value}
          </p>

          {/* Trend Indicator */}
          {trend && (
            <div
              // Uses the determined color class from helper function
              className={`flex items-center gap-1 text-sm font-bold ${trendColorClass}`}
            >
              {/* Uses the determined Icon component from helper function */}
              <TrendIcon className="text-xs" />
              <span>{trendValue}</span>
              <span className="text-slate-400 font-medium text-xs">
                vs last period
              </span>
            </div>
          )}
          {subValue && (
            <p className="text-xs text-slate-500 pt-1">{subValue}</p>
          )}
        </div>

        {/* Icon Container */}
        <div
          className={`p-4 rounded-xl bg-gradient-to-br ${gradient} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0`}
        >
          <Icon className="text-2xl text-white" />
        </div>
      </div>

      {/* Bottom Accent Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/50">
        <div
          className={`h-full bg-gradient-to-r ${gradient} w-0 group-hover:w-full transition-all duration-700`}
        />
      </div>
    </div>
  );
};

// Mini Stat Card (Small Stat) - Named Export
export const MiniStatCard = ({
  icon: Icon,
  label,
  value,
  color = "bg-slate-300",
  delay,
}) => (
  <div
    className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 transition-all duration-300 animate-fadeInUp shadow-sm hover:shadow-md hover:border-slate-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Icon Container: Added default color fallback */}
    <div className={`p-3 rounded-xl ${color} shadow-lg flex-shrink-0`}>
      <Icon className="text-base text-white" />
    </div>
    <div className="flex-1">
      {/* Value */}
      <p className="text-xl font-extrabold text-slate-900 leading-none">
        {value}
      </p>
      {/* Label */}
      <p className="text-xs text-slate-500 uppercase tracking-widest pt-1">
        {label}
      </p>
    </div>
  </div>
);

export default React.memo(KPICard);
