import React from "react";
import {
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
} from "react-icons/fa";

/**
 * ResultsOverviewCard Component
 * Renders a single, stylized KPI card with gradient background and trend data.
 */
const ResultsOverviewCard = ({
  label,
  value,
  icon: Icon,
  gradient,
  trend,
  trendValue,
}) => {
  // Determine trend icon and color
  const TrendIcon =
    trend === "up" ? FaArrowUp : trend === "down" ? FaArrowDown : FaMinus;
  const trendColor =
    trend === "up"
      ? "text-emerald-300"
      : trend === "down"
      ? "text-red-300"
      : "text-slate-300";

  return (
    <div
      className={`relative p-5 rounded-2xl overflow-hidden 
                        bg-gradient-to-br ${gradient} 
                        text-white shadow-xl hover:shadow-2xl transition duration-300 transform hover:scale-[1.01]`}
    >
      {/* Background elements for visual flair */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20 bg-white/50 rounded-full blur-xl transform translate-x-1/4 -translate-y-1/4"></div>

      {/* Icon (large and slightly transparent) */}
      <div className="absolute bottom-2 right-2 opacity-10">
        <Icon className="w-16 h-16" />
      </div>

      {/* Content */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        {/* Main Value */}
        <p className="text-4xl font-extrabold leading-none tracking-tight">
          {value}
        </p>
        {/* Micro Trend Indicator */}
        {trend && (
          <div className="flex items-center text-sm font-semibold p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <TrendIcon className={`w-3 h-3 mr-1 ${trendColor}`} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm font-medium opacity-80 mt-1 relative z-10">
        {label}
      </p>
    </div>
  );
};

/**
 * ResultsOverview Component
 * Renders the full grid of results overview cards.
 */
const ResultsOverview = ({ results }) => {
  // If results is null or empty, return a placeholder
  if (!results || results.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-6 flex items-center justify-center">
        <p className="text-slate-500 font-medium">No results data available.</p>
      </div>
    );
  }

  // Assigning default icons and gradients based on the mock data structure
  // in DashboardHome.jsx (which I updated in the previous response).
  const defaultResults = results.map((item) => ({
    ...item,
    // Using provided icons, or a default
    icon: item.icon || FaChartLine,
    // Using provided gradient, or a default
    gradient: item.gradient || "from-blue-600 to-indigo-700",
    // Ensuring trend is set for the display logic
    trend: item.trend || null,
    trendValue: item.trendValue || null,
  }));

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight ml-2">
        Exam & Academic Performance
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {defaultResults.map((item, index) => (
          <ResultsOverviewCard
            key={index}
            label={item.label}
            value={item.value}
            icon={item.icon}
            gradient={item.gradient}
            trend={item.trend}
            trendValue={item.trendValue}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(ResultsOverview);
