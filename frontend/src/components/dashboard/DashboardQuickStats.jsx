import React from "react";
// Assuming MiniStatCard is a robust, well-styled component itself
import { MiniStatCard } from "../common/KPICard";
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaCheckCircle,
} from "react-icons/fa";

// Destructure 'stats' and provide an empty default object {}
const DashboardQuickStats = ({ stats = {} }) => {
  const {
    totalClasses = "N/A",
    totalTeachers = "N/A",
    attendanceRate = "N/A",
  } = stats;

  return (
    // ✨ MODERN UI: Applied standard card styling
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-100 space-y-5">
      <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">
        Key Stats Today
      </h3>

      <div className="space-y-4">
        {/* Total Classes */}
        <MiniStatCard
          icon={FaGraduationCap}
          label="Total Classes"
          value={totalClasses}
          color="bg-purple-600" // Deeper, more vibrant color
          delay={0}
        />

        {/* Total Teachers */}
        <MiniStatCard
          icon={FaChalkboardTeacher}
          label="Active Teachers" // Slight label refinement
          value={totalTeachers}
          color="bg-emerald-600"
          delay={50}
        />

        {/* Attendance Rate */}
        <MiniStatCard
          icon={FaCheckCircle}
          label="Daily Attendance Rate" // More descriptive label
          value={attendanceRate}
          color="bg-blue-600"
          delay={100}
        />
      </div>
    </div>
  );
};

export default React.memo(DashboardQuickStats);
