import React from "react";
import { FaShieldAlt } from "react-icons/fa";
import SectionHeader from "../common/SectionHeader";

const ComplaintSummary = ({ complaints = {} }) => {
  // Assuming the complaints object structure is { open: 5, pending: 2, resolved: 10 }
  const { open, pending, resolved } = complaints;

  return (
    // ✨ MODERN UI: Applied standard card styling
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-6">
      <SectionHeader
        icon={FaShieldAlt}
        title="Complaint Summary"
        // Refined icon background color for serious/alert status
        iconBg="bg-red-100 text-red-600"
      />
      <div className="grid grid-cols-3 gap-4 mt-4">
        {" "}
        {/* Increased gap for more breathing room */}
        {/* Open */}
        <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-inner hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <p className="text-3xl font-extrabold text-amber-600 leading-none">
            {open || 0}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider mt-1">
            Open
          </p>
        </div>
        {/* Pending */}
        <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200 shadow-inner hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <p className="text-3xl font-extrabold text-blue-600 leading-none">
            {pending || 0}
          </p>
          <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider mt-1">
            Pending
          </p>
        </div>
        {/* Resolved */}
        <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-inner hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <p className="text-3xl font-extrabold text-emerald-600 leading-none">
            {resolved || 0}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider mt-1">
            Resolved
          </p>
        </div>
      </div>
    </section>
  );
};

export default React.memo(ComplaintSummary);
