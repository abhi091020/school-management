import React from "react";
import { FaHistory, FaChevronRight, FaCircle } from "react-icons/fa";
import EmptyState from "../common/EmptyState";
import { ActivitySkeleton } from "../common/Skeleton";

// Helper component for the activity icon (similar to NotificationIcon)
const ActivityIcon = ({ icon: Icon, iconBg, isNew }) => {
  return (
    <div className="relative h-full pt-3 pr-4 flex-shrink-0">
      {/* Vertical Status Indicator (Harmonized with Notifications) */}
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-md 
            ${isNew ? "bg-red-500" : "bg-transparent"}`}
      ></div>

      {/* Activity Icon */}
      <div className={`p-2 rounded-full ${iconBg}`}>
        <FaCircle className="w-2 h-2 text-white" />
      </div>
    </div>
  );
};

const ActivityItem = ({ icon, iconBg, title, description, time, isNew }) => {
  return (
    <button
      className={`w-full flex items-start text-left rounded-xl transition-all duration-300 border p-0 relative 
        ${
          isNew ? "bg-red-50/50 border-red-200" : "bg-slate-50 border-slate-100"
        }
        hover:bg-blue-50 hover:shadow-md group`}
      onClick={() => {
        /* Navigate to activity detail */
      }}
    >
      {/* 1. Icon Block (Harmonized) */}
      <ActivityIcon icon={icon} iconBg={iconBg} isNew={isNew} />

      {/* 2. Details and Right Block Container (Harmonized P-3) */}
      <div className="flex-1 p-3 flex justify-between items-center">
        {/* Left: Title & Description */}
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">
            {title}
          </p>
          <time className="text-xs text-slate-500 mt-0.5 block">{time}</time>
        </div>

        {/* Right: Arrow */}
        <div className="flex flex-col items-end pl-3 flex-shrink-0 self-start mt-0.5">
          {/* Structure filler to match Notification's badge/priority element height */}
          <span className="text-xs text-slate-600 block line-clamp-1 opacity-0 h-[10px]"></span>
          <FaChevronRight className="w-3 h-3 text-slate-400 mt-2" />
        </div>
      </div>
    </button>
  );
};

const RecentActivities = ({
  recentActivities = [],
  loadingActivities,
  navigate,
}) => {
  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* 1. Header - MANUAL, ALIGNED STRUCTURE (p-5, identical to Notifications) */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          {/* Left Side: Icon and Title */}
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600">
              <FaHistory className="w-5 h-5 text-white" />
            </div>
            Recent Activities
          </h3>

          {/* Right Side: Action Button (Replaces Notification Badge) */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate && navigate("/admin/activity-log")}
              className="px-3 py-1 text-xs font-bold bg-cyan-100 text-cyan-700 rounded-full transition-colors hover:bg-cyan-200"
            >
              View Log
            </button>
          </div>
        </div>
      </div>

      {/* 2. Activity List Content - Standardized P-4 Padding */}
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar p-4">
        {loadingActivities ? (
          Array(4)
            .fill(0)
            .map((_, i) => <ActivitySkeleton key={i} />)
        ) : recentActivities.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FaHistory}
              title="No activities"
              description="User activity will be logged here."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, i) => (
              <ActivityItem
                key={i}
                {...activity}
                isNew={i < 3}
                icon={activity.icon || FaCircle}
                iconBg={activity.iconBg || "bg-slate-500"}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Footer - Standardized P-3 Padding (Identical to Notification Footer) */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => navigate("/admin/activity-log")}
          className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
        >
          View All Activities
        </button>
      </div>
    </section>
  );
};

export default React.memo(RecentActivities);
