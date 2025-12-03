import React from "react";
import {
  FaUserPlus,
  FaClipboardList,
  FaCalendarCheck,
  FaCog,
  FaArrowRight,
} from "react-icons/fa";
import SectionHeader from "../common/SectionHeader"; // Assuming this is an existing component

// Mock data for the Quick Actions tiles
const actionTiles = [
  {
    label: "Register New Student",
    icon: FaUserPlus,
    color: "text-blue-600",
    bg: "bg-blue-100",
    link: "/admin/students/add",
  },
  {
    label: "Manage Daily Attendance",
    icon: FaClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    link: "/admin/attendance",
  },
  {
    label: "Publish Exam Results",
    icon: FaCalendarCheck,
    color: "text-purple-600",
    bg: "bg-purple-100",
    link: "/admin/exams/publish",
  },
  {
    label: "Access Full Admin Panel",
    icon: FaCog,
    color: "text-slate-600",
    bg: "bg-slate-100",
    link: "/admin/settings",
  },
];

const QuickActionItem = ({ icon: Icon, label, color, bg, link, navigate }) => (
  <button
    onClick={() => navigate(link)}
    // Tile Styles: Clean background, defined border/shadow, excellent hover state
    className="flex flex-col items-center justify-center p-4 sm:p-6 text-center 
               bg-white rounded-xl border border-slate-200 shadow-lg 
               hover:shadow-xl hover:scale-[1.02] transition duration-300 ease-in-out"
  >
    <div
      // Icon Container: Added shadow-md for a slight lift
      className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 ${bg} shadow-md`}
    >
      <Icon className={`text-xl ${color}`} />
    </div>
    <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug">
      {label}
    </p>
  </button>
);

const DashboardQuickActions = ({ navigate }) => {
  return (
    // Outer card structure for the entire component, consistent with other dashboard sections
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-5">
      {/* Header for the quick actions section */}
      <SectionHeader
        icon={FaArrowRight}
        title="Quick Access & Tools"
        iconBg="bg-amber-100 text-amber-700"
        action
        actionLabel="View All Tools"
        onAction={() => navigate && navigate("/admin/tools")}
      />

      {/* Grid Layout for Quick Action Tiles */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {actionTiles.map((item, index) => (
          <QuickActionItem
            key={index}
            icon={item.icon}
            label={item.label}
            color={item.color}
            bg={item.bg}
            link={item.link}
            navigate={navigate}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(DashboardQuickActions);
