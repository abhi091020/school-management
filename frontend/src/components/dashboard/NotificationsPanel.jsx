import React from "react";
import { FaBell, FaChevronRight, FaCircle } from "react-icons/fa";
import { NotificationSkeleton } from "../common/Skeleton";
import EmptyState from "../common/EmptyState";
import { PriorityBadge } from "../common/StatusBadge";

// Helper component for the unread indicator and icon
const NotificationIcon = ({ isUnread }) => {
  return (
    <div className="relative h-full pt-1 pr-4 flex-shrink-0">
      {/* Vertical Unread/Read Status Indicator */}
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-md 
            ${isUnread ? "bg-red-500" : "bg-transparent"}`}
      ></div>

      {/* Notification Icon (using FaCircle for smaller dot) */}
      <div
        className={`p-2 rounded-full ${
          isUnread ? "bg-red-100" : "bg-slate-100"
        }`}
      >
        <FaCircle
          className={`w-2 h-2 ${isUnread ? "text-red-500" : "text-slate-300"}`}
        />
      </div>
    </div>
  );
};

const NotificationsPanel = ({
  notifications,
  loadingNotifications,
  navigate,
}) => {
  const unreadCount = notifications
    ? notifications.filter((_, i) => i < 3).length
    : 0;

  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* 1. Header - MANUAL, ALIGNED STRUCTURE (p-5, identical to Activities) */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          {/* Left Side: Icon and Title */}
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600">
              <FaBell className="w-5 h-5 text-white" />
            </div>
            Recent Notifications
          </h3>

          {/* Right Side: Badge */}
          <div className="flex-shrink-0">
            {unreadCount > 0 && (
              <span className="px-3 py-1 text-xs font-extrabold bg-red-600 text-white rounded-full animate-pulse shadow-md">
                {unreadCount} Unread
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Content (Scrollable List) - Standardized P-4 Padding */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {loadingNotifications ? (
          Array(4)
            .fill(0)
            .map((_, i) => <NotificationSkeleton key={i} />)
        ) : notifications && notifications.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FaBell}
              title="All caught up!"
              description="No new notifications to show."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const isUnread = i < 3;

              return (
                <button
                  key={i}
                  className={`w-full flex items-start text-left rounded-xl transition-all duration-300 border p-0 relative 
                    ${
                      isUnread
                        ? "bg-red-50/50 border-red-200"
                        : "bg-slate-50 border-slate-100"
                    }
                    hover:bg-blue-50 hover:shadow-md group`}
                  onClick={() => navigate("/admin/notifications")}
                >
                  {/* 1. Unread Indicator and Small Icon */}
                  <NotificationIcon isUnread={isUnread} />

                  {/* 2. Message and Time/Priority Block (Harmonized P-3) */}
                  <div className="flex-1 p-3 flex justify-between items-center">
                    {/* Left: Message & Time */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                        {n.message}
                      </p>
                      <time className="text-xs text-slate-500 mt-0.5 block">
                        {n.time}
                      </time>
                    </div>

                    {/* Right: Priority Badge and Nav Icon */}
                    <div className="flex flex-col items-end pl-3 flex-shrink-0 self-start mt-0.5">
                      <PriorityBadge priority={n.priority} />
                      <FaChevronRight className="w-3 h-3 text-slate-400 mt-2" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Footer - Standardized P-3 Padding (Identical to Activity Footer) */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => navigate("/admin/notifications")}
          className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </section>
  );
};

export default React.memo(NotificationsPanel);
