import React from "react";
import dayjs from "dayjs";
import { FaClipboardList, FaTimesCircle } from "react-icons/fa";
// Ensure TableRowSkeleton, StatusBadge, EmptyState are imported from correct relative paths

const AttendanceTable = ({
  attendance,
  overview = {}, // Ensure overview is not null
  loadingAttendance,
  attendanceError,
  attendanceMeta = {}, // Ensure attendanceMeta is not null
  navigate,
  handleRetry,
}) => {
  const todayStr = dayjs().format("MMM DD");

  return (
    // ✨ MODERN UI: Applied standard dashboard card styling
    <section className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
            {/* Icon with refined, subtler accent */}
            <div className="p-2 rounded-xl bg-blue-50">
              <FaClipboardList className="text-blue-600 text-sm" />
            </div>
            Today's Attendance Snapshot
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
              {overview.attendanceToday || 0} Present
            </span>
            <span className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
              {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* Table Content Area */}
      {/* Increased max-h for a slightly taller, less cramped card */}
      <div className="overflow-x-auto max-h-96">
        {loadingAttendance ? (
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {/* NOTE: Requires TableRowSkeleton component definition */}
              {/* {Array(5).fill(0).map((_, i) => (<TableRowSkeleton key={i} />))} */}
            </tbody>
          </table>
        ) : attendanceError ? (
          <div className="p-8 text-center">
            <div className="p-4 rounded-2xl bg-red-50 inline-block mb-3">
              <FaTimesCircle className="text-2xl text-red-500" />
            </div>
            <p className="text-red-600 font-medium">
              Failed to load attendance
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : attendance.length === 0 ? (
          <EmptyState
            icon={FaClipboardList}
            title="No attendance records today"
            description="Attendance records will appear here after submission."
          />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec, i) => (
                <tr
                  key={rec._id ?? i}
                  // ✨ MODERN UI: Refined hover state
                  className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors duration-200"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar with cleaner gradient */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {(rec.studentName ?? "?")[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 text-sm">
                        {rec.studentName ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-medium">
                    {rec.className ?? "—"}
                  </td>
                  <td className="py-3 px-4">
                    {/* NOTE: Requires StatusBadge component definition */}
                    {/* <StatusBadge status={rec.status} /> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination */}
      {attendanceMeta.total > 0 && ( // Only show footer if there are records
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {attendanceMeta.page || 1} of {attendanceMeta.totalPages || 1}{" "}
            • {attendanceMeta.total} records
          </p>
          <button
            onClick={() => navigate("/admin/attendance")}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All Attendance →
          </button>
        </div>
      )}
    </section>
  );
};

export default React.memo(AttendanceTable);
