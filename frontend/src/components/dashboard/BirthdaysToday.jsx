import React from "react";
import { FaBirthdayCake, FaUserCircle, FaGraduationCap } from "react-icons/fa"; // Added FaUserCircle and FaGraduationCap
import SectionHeader from "../common/SectionHeader";
import EmptyState from "../common/EmptyState";

// --- REVISED INLINE BirthdayCard REPLACEMENT (Clean & Professional) ---
// This component focuses on clear separation and role recognition.
const ProfessionalBirthdayItem = ({ name, role }) => {
  const isStudent = role && role.toLowerCase().includes("student");
  const RoleIcon = isStudent ? FaGraduationCap : FaUserCircle;

  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 
                       transition-all duration-300 hover:bg-pink-50 hover:border-pink-300 cursor-pointer group"
    >
      {/* 1. Icon and Name */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full flex-shrink-0 
                                ${
                                  isStudent
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-pink-100 text-pink-600"
                                }`}
        >
          <RoleIcon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{name}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {role || "Staff Member"}
          </span>
        </div>
      </div>

      {/* 2. Birthday Accent */}
      <FaBirthdayCake className="w-5 h-5 text-pink-500 opacity-70 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
// --------------------------------------------------------------------------

const BirthdaysToday = ({ birthdays, navigate }) => {
  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header Area */}
      <div className="p-5 border-b border-slate-100">
        <SectionHeader
          icon={FaBirthdayCake}
          title="Birthdays Today"
          iconBg="bg-pink-100 text-pink-700"
          action
          actionLabel="View All Staff"
          onAction={() => navigate && navigate("/app/directory")}
        />
      </div>

      {/* Content Area - Clean List */}
      <div className="p-4 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
        {birthdays.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FaBirthdayCake}
              title="No birthdays"
              description="No birthdays are scheduled for today."
            />
          </div>
        ) : (
          <div className="space-y-2">
            {birthdays.slice(0, 5).map((person, i) => (
              <ProfessionalBirthdayItem key={i} {...person} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(BirthdaysToday);
