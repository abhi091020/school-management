import React from "react";

// Empty State
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="p-5 rounded-3xl bg-slate-100 mb-3 border border-slate-200">
      <Icon className="text-3xl text-slate-400" />
    </div>
    <h4 className="font-bold text-slate-700 text-base mb-1">{title}</h4>
    <p className="text-sm text-slate-500 max-w-xs">{description}</p>
  </div>
);

export default React.memo(EmptyState);
