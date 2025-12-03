import React from "react";
import { Bar } from "react-chartjs-2";
import { FaChartBar } from "react-icons/fa";
// Ensure BarElement, CategoryScale, LinearScale, Tooltip, Legend are registered globally

const AttendanceChart = ({ attendanceChart, barChartOptions, navigate }) => {
  // Added navigate prop
  const data = {
    labels: attendanceChart.labels,
    datasets: attendanceChart.datasets,
  };

  return (
    // ✨ MODERN UI: Updated card styling to match DashboardHome.jsx
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg overflow-hidden">
      {/* Header Area: Clean and Defined */}
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon with lighter accent */}
          <div className="p-2 rounded-xl bg-blue-50">
            <FaChartBar className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Weekly Attendance Snapshot
          </h2>
        </div>
        {/* Metric Label */}
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Current Week
        </span>
      </div>

      {/* Chart Area: Main Content */}
      <div className="flex-1 p-5 pt-4 flex items-center justify-center min-h-64">
        <div className="relative w-full h-full">
          <Bar
            key="weekly-attendance-chart"
            data={data}
            options={barChartOptions}
          />
        </div>
      </div>

      {/* Footer: Context and Call to Action */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <p className="text-sm text-slate-600 font-medium">
          Overall average attendance:{" "}
          <span className="text-blue-600 font-bold">92.4%</span>
        </p>
        <button
          onClick={() => navigate && navigate("/admin/attendance")} // Assumes navigate prop is passed
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          View Full Report →
        </button>
      </div>
    </div>
  );
};

export default React.memo(AttendanceChart);
