import React from "react";
import { FaBook } from "react-icons/fa";
import SectionHeader from "../common/SectionHeader";

const LibraryStats = ({ libraryStats = {} }) => {
  const { issued, returned, overdue } = libraryStats;

  return (
    // ✨ MODERN UI: Applied standard card styling
    <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-6">
      <SectionHeader
        icon={FaBook}
        title="Library Overview" // Expanded title
        // Refined accent color
        iconBg="bg-amber-100 text-amber-700"
      />

      {/* Separated stats with lines for clarity */}
      <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
        {/* Books Issued */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-sm text-slate-600 font-medium">
            Total Books Issued
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {issued || 0}
          </span>
        </div>

        {/* Returned Today */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-sm text-slate-600 font-medium">
            Returned Today
          </span>
          <span className="text-xl font-extrabold text-emerald-600">
            {returned || 0}
          </span>
        </div>

        {/* Overdue */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-slate-600 font-medium">
            Currently Overdue
          </span>
          <span className="text-xl font-extrabold text-red-600">
            {overdue || 0}
          </span>
        </div>
      </div>
    </section>
  );
};

export default React.memo(LibraryStats);
