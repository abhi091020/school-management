import React from "react";
import { FaBullhorn } from "react-icons/fa";

const AnnouncementsBanner = ({ announcements, navigate }) => {
  if (announcements.length === 0) return null;

  return (
    <section
      // ✨ MODERN UI: Updated gradient and removed busy background pattern
      className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl shadow-2xl p-6 text-white overflow-hidden relative"
      // Removed inline style animation for clean Tailwind approach
    >
      {/* Subtle graphic element */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Icon with refined background */}
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
            <FaBullhorn className="text-2xl" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold mb-1 tracking-tight">
              Latest Announcements
            </h3>
            <div className="space-y-1.5">
              {announcements.slice(0, 2).map((a, i) => (
                <p
                  key={i}
                  className="text-base text-white/90 flex items-center gap-2 font-medium"
                >
                  {/* Modernized bullet point */}
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 flex-shrink-0" />
                  {a.title} —{" "}
                  <span className="text-white/70 font-normal">{a.date}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => navigate("/admin/announcements")}
          // ✨ MODERN UI: Updated button to a cleaner, high-contrast, yet subtle style
          className="px-6 py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl shadow-lg hover:bg-indigo-100 hover:scale-[1.02] transition-all duration-300 flex-shrink-0"
        >
          Post Announcement
        </button>
      </div>
    </section>
  );
};

export default React.memo(AnnouncementsBanner);
