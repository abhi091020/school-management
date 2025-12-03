import React from "react";

const QuickActionButton = ({ icon: Icon, label, onClick, gradient, delay }) => (
  <button
    onClick={onClick}
    // ✨ MODERN UI: Deeper shadow, larger padding, and stronger hover lift
    className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r ${gradient} text-white font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-fadeInUp`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Shine Effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

    {/* Icon Container: Larger and more defined */}
    <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md">
      <Icon className="text-base" />
    </div>
    <span className="relative">{label}</span>
  </button>
);

export default React.memo(QuickActionButton);
