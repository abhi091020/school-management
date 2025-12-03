import React from "react";
import dayjs from "dayjs";
import {
  FaUserClock,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronRight,
} from "react-icons/fa"; // Added FaChevronRight
import EmptyState from "../common/EmptyState";

// Helper function to get an icon based on approval type (for visual cue)
const getTypeIcon = (type) => {
  switch (type.toLowerCase().trim()) {
    case "leave request":
      return <FaUserClock className="w-4 h-4 text-amber-600" />;
    case "new schedule":
      return <FaCalendarAlt className="w-4 h-4 text-blue-600" />; // Assuming FaCalendarAlt is imported or available
    default:
      return <FaUserClock className="w-4 h-4 text-slate-500" />;
  }
};

const PendingApprovals = ({ pendingApprovals = [], navigate }) => {
  // Assume 'navigate' is passed if needed
  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <FaUserClock className="text-amber-600 w-5 h-5" />
            </div>
            Action Required
          </h3>
          {pendingApprovals.length > 0 && (
            <span className="px-3 py-1 text-xs font-bold bg-amber-500 text-white rounded-full shadow-md">
              {pendingApprovals.length} Pending
            </span>
          )}
        </div>
        {/* Added View All button in the header */}
        <button
          onClick={() => navigate && navigate("/admin/approvals")}
          className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors mt-2 ml-10"
        >
          View All Approvals
        </button>
      </div>

      {/* List of Approvals */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {pendingApprovals.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FaUserClock}
              title="All clear!"
              description="No pending approvals require your attention."
            />
          </div>
        ) : (
          pendingApprovals.map((item, i) => (
            <div
              key={i}
              className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-400"
            >
              {/* 1. Details Container */}
              <div>
                {/* Type Badge */}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 tracking-wider">
                  {item.type}
                </span>

                {/* Name */}
                <p className="font-bold text-slate-900 text-base mt-1 flex items-center gap-2">
                  <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                  {item.name}
                </p>
                {/* Date */}
                <p className="text-xs text-slate-600 ml-3 mt-0.5">
                  Submitted:{" "}
                  <span className="font-medium">
                    {dayjs(item.date).format("MMM DD, YYYY")}
                  </span>
                </p>
              </div>

              {/* 2. Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  title="Approve"
                  className="w-10 h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FaCheckCircle className="w-4 h-4 mx-auto" />
                </button>
                <button
                  title="Reject"
                  className="w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FaTimesCircle className="w-4 h-4 mx-auto" />
                </button>
                {/* Optional: Detail view button */}
                <button
                  title="View Details"
                  className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors shadow-sm hover:shadow-md"
                >
                  <FaChevronRight className="w-3 h-3 mx-auto" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default React.memo(PendingApprovals);
