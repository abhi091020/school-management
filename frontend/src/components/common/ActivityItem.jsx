import React from "react";

// Activity Item
const ActivityItem = ({
  icon: Icon,
  iconBg,
  title,
  description,
  time,
  delay,
}) => (
  <div
    className="group flex gap-4 p-4 hover:bg-slate-50 transition-all duration-300 animate-fadeInUp"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`p-2 rounded-xl ${iconBg} flex-shrink-0 shadow-md`}>
      {/* Refinement: Increased icon size to text-lg for visual prominence */}
      <Icon className="text-lg text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
      <p className="text-xs text-slate-500 truncate">{description}</p>
    </div>
    {/* Refinement: Changed text-slate-400 to text-slate-500 for better contrast */}
    <span className="text-xs text-slate-500 flex-shrink-0">{time}</span>
  </div>
);

export default React.memo(ActivityItem);
