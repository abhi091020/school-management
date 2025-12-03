import React from "react";
import { FaSyncAlt } from "react-icons/fa";

const DashboardHeader = ({
  userName,
  currentTime,
  isRefreshing,
  handleRefresh,
}) => {
  return (
    // Main Container: Modernized Glassmorphism style
    <div className="relative p-6 md:p-8 bg-white/80 backdrop-blur-lg rounded-3xl border border-blue-100 shadow-2xl shadow-blue-300/40 transition-all duration-300 hover:shadow-blue-400/50">
      {/* Content Layout: Responsive flex container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12">
        {/* LEFT SECTION: Main Title and Welcome Message */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title Row */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight truncate">
              Analytics Dashboard
            </h1>
            <span
              className="text-3xl animate-waving-hand"
              role="img"
              aria-label="waving hand"
            >
              👋
            </span>
          </div>

          {/* Subtitle Row: Clear welcome message */}
          <p className="text-lg text-gray-500 font-medium">
            Welcome back,{" "}
            <span className="font-bold text-blue-600">{userName}</span>. Time to
            analyze performance.
          </p>
        </div>

        {/* Separator */}
        <div className="hidden md:block h-12 w-px bg-gray-300/50"></div>

        {/* RIGHT SECTION: Real-Time Clock and Actions */}
        <div className="flex-shrink-0 flex items-center gap-6 sm:gap-8">
          {/* Clock Display and Live Status */}
          <div className="flex flex-col items-center leading-tight">
            {/* Live Feed Status */}
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                LIVE FEED
              </span>
            </span>

            {/* 👇 GUARANTEED FIX: Re-adding 'font-mono' for fixed width, slightly reduced text size to compensate for monospace font width */}
            <span className="text-3xl font-extrabold text-blue-700 tabular-nums font-mono">
              {currentTime || "00:00:00"}
            </span>
          </div>

          {/* Refresh Button: Modern, circular design */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-wait active:scale-95 flex-shrink-0 group"
            title="Refresh Data"
          >
            <FaSyncAlt
              size={20}
              className={
                isRefreshing
                  ? "animate-spin"
                  : "transform transition duration-500 group-hover:rotate-90"
              }
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardHeader);
