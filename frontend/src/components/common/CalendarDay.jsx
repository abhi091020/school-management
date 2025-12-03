import React from "react";

// Calendar Day
const CalendarDay = ({ day, isToday, hasEvent, eventColor }) => (
  <div
    className={`relative p-2 text-center rounded-xl text-sm transition-all duration-200 cursor-pointer select-none
    ${
      isToday
        ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/50 transform scale-105"
        : "hover:bg-slate-200 text-slate-800 font-medium"
    }
    ${!day ? "invisible" : ""}`}
  >
    {day}
    {hasEvent && (
      <span
        className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ring-2 ring-white
          ${eventColor || "bg-blue-500"}`}
      />
    )}
  </div>
);

export default React.memo(CalendarDay);
